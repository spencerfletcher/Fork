// The Cookbook's select mode: one act on many recipes at once. Every id is
// checked here, in the request's one transaction: an id outside the cook's
// library (or, for a tag or the Trash, not their own) is left alone and
// counted as skipped, never refused, so the answer never says whether
// another cook's recipe exists.
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import { collectionRecipes, collections, recipes, recipesToTags } from './db/schema.js';
import { inLibraryOf } from './visibility.js';
import { collectionsOf, createCollection } from './collections.js';
import { tagIdsFor } from './tags.js';
import { commitSave } from './versions.js';
import { moveToTrash } from './trash.js';
import { CAPS } from '#lib/recipes/validation.js';
import { CARDS_PER_PAGE, MAX_PAGES } from '#lib/listPage.js';
import { wholeNumber } from '#lib/helpers.js';

/** The most a request may name: every card a Cookbook URL can show at once. */
export const BULK_MAX = CARDS_PER_PAGE * MAX_PAGES;

/** A request's `ids` field ("3,5,8"): whole numbers, repeats dropped, 1 to BULK_MAX of them; null otherwise. */
export function selectedIds(field: string): number[] | null {
	const ids = field.split(',').map(wholeNumber);
	if (ids.some((id) => id === null)) return null;
	const unique = [...new Set(ids as number[])];
	return unique.length > 0 && unique.length <= BULK_MAX ? unique : null;
}

type Conn = Tx | typeof db;
type Cook = { id: string };

/** A collection's state for the whole selection: all of it in, some, or none. */
export type BulkCollection = { id: number; name: string; has: boolean | 'mixed' };

/** Which of `ids` are in the cook's library (own only: theirs alone), ordered by id, the order rows are locked in. */
async function selectionOf(user: Cook, ids: number[], own: boolean, conn: Conn, lock = false) {
	const query = conn
		.select({ id: recipes.id, authorId: recipes.authorId })
		.from(recipes)
		.where(
			and(
				inArray(recipes.id, ids),
				inLibraryOf(user),
				own ? eq(recipes.authorId, user.id) : undefined
			)
		)
		.orderBy(recipes.id);
	return lock ? query.for('update') : query;
}

/** The cook's collections, oldest first, each saying whether all, some or none of the selection in their library is in it. */
export async function collectionsFor(
	user: Cook,
	ids: number[],
	conn: Conn = db
): Promise<BulkCollection[]> {
	const [list, chosen] = await Promise.all([
		collectionsOf(user, undefined, conn),
		selectionOf(user, ids, false, conn)
	]);
	const inside = chosen.length
		? await conn
				.select({ id: collectionRecipes.collectionId, n: count() })
				.from(collectionRecipes)
				.innerJoin(collections, eq(collections.id, collectionRecipes.collectionId))
				.where(
					and(
						eq(collections.ownerId, user.id),
						inArray(
							collectionRecipes.recipeId,
							chosen.map((r) => r.id)
						)
					)
				)
				.groupBy(collectionRecipes.collectionId)
		: [];
	const held = new Map(inside.map((c) => [c.id, c.n]));
	return list.map(({ id, name }) => {
		const n = held.get(id) ?? 0;
		return { id, name, has: n === 0 ? false : n === chosen.length ? true : 'mixed' };
	});
}

/**
 * Puts every recipe of the selection in the cook's library into their
 * collection (`member`) or takes it out. Null when the collection is not
 * theirs; `changed` counts the links made or removed.
 */
export async function collectAll(
	user: Cook,
	collectionId: number,
	ids: number[],
	member: boolean,
	conn: Conn = db
): Promise<{ changed: number; skipped: number } | null> {
	return conn.transaction(async (tx) => {
		const [owned] = await tx
			.select({ id: collections.id })
			.from(collections)
			.where(and(eq(collections.id, collectionId), eq(collections.ownerId, user.id)));
		if (!owned) return null;
		const chosen = (await selectionOf(user, ids, false, tx)).map((r) => r.id);
		const skipped = ids.length - chosen.length;
		if (chosen.length === 0) return { changed: 0, skipped };
		const changed = member
			? await tx
					.insert(collectionRecipes)
					.values(chosen.map((recipeId) => ({ collectionId, recipeId })))
					.onConflictDoNothing()
					.returning({ id: collectionRecipes.recipeId })
			: await tx
					.delete(collectionRecipes)
					.where(
						and(
							eq(collectionRecipes.collectionId, collectionId),
							inArray(collectionRecipes.recipeId, chosen)
						)
					)
					.returning({ id: collectionRecipes.recipeId });
		return { changed: changed.length, skipped };
	});
}

/** A new collection holding the selection, or why the name is refused (and nothing made). */
export async function newCollectionWith(
	user: Cook,
	name: string,
	ids: number[],
	conn: Conn = db
): Promise<{ id: number; changed: number; skipped: number } | { error: string }> {
	return conn.transaction(async (tx) => {
		const created = await createCollection(user.id, name, tx);
		if ('error' in created) return created;
		const added = await collectAll(user, created.id, ids, true, tx);
		// The collection was made in this transaction, so it is the cook's.
		return { id: created.id, ...added! };
	});
}

/**
 * Adds `names` to each of the cook's own recipes in the selection, as the
 * editor saves tags: a setting, so no version is written, and the revision
 * moves on so an open editor goes stale. A recipe the missing ones would take
 * past CAPS.tags is left as it is (`full`); `already` had them all. The
 * names are checked by the caller.
 */
export async function tagAll(
	user: Cook,
	names: string[],
	ids: number[],
	conn: Conn = db
): Promise<{ changed: number; already: number; full: number; skipped: number }> {
	return conn.transaction(async (tx) => {
		const own = (await selectionOf(user, ids, true, tx, true)).map((r) => r.id);
		const skipped = ids.length - own.length;
		if (own.length === 0) return { changed: 0, already: 0, full: 0, skipped };
		const tagIds = await tagIdsFor(tx, names);
		const held = await tx
			.select({
				id: recipesToTags.recipeId,
				n: count(),
				have: sql<number>`count(*) filter (where ${inArray(recipesToTags.tagId, tagIds)})`.mapWith(
					Number
				)
			})
			.from(recipesToTags)
			.where(inArray(recipesToTags.recipeId, own))
			.groupBy(recipesToTags.recipeId);
		const byId = new Map(held.map((h) => [h.id, h]));
		const missing = (id: number) => tagIds.length - (byId.get(id)?.have ?? 0);
		const already = own.filter((id) => missing(id) === 0);
		const full = own.filter(
			(id) => missing(id) > 0 && (byId.get(id)?.n ?? 0) + missing(id) > CAPS.tags
		);
		const taking = own.filter((id) => !already.includes(id) && !full.includes(id));
		if (taking.length > 0) {
			await tx
				.insert(recipesToTags)
				.values(taking.flatMap((recipeId) => tagIds.map((tagId) => ({ recipeId, tagId }))))
				.onConflictDoNothing();
			await commitSave(tx, taking, {});
		}
		return { changed: taking.length, already: already.length, full: full.length, skipped };
	});
}

/**
 * Moves each of the cook's own recipes in the selection to the Trash, each
 * through moveToTrash (savers' copies granted under its row lock), in id order.
 */
export async function trashAll(
	user: Cook,
	ids: number[],
	conn: Conn = db
): Promise<{ moved: number; skipped: number }> {
	return conn.transaction(async (tx) => {
		const own = await selectionOf(user, ids, true, tx);
		// ponytail: one moveToTrash per recipe (a lock, the copies, an update),
		// at most BULK_MAX; a set-based grant if a big Trash ever runs slow.
		for (const recipe of own) await moveToTrash(recipe, tx);
		return { moved: own.length, skipped: ids.length - own.length };
	});
}
