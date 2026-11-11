import type { SupabaseClient } from '@supabase/supabase-js';
import {
	and,
	eq,
	gt,
	inArray,
	isNotNull,
	isNull,
	lte,
	notInArray,
	or,
	type SQL
} from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db } from './db/index.js';
import {
	collectionRecipes,
	collections,
	favorites,
	recipes,
	recipesToTags,
	recipeVersions
} from './db/schema.js';
import { imagePathOf, removeRecipeImage } from './images.js';
import { plural } from '#lib/helpers.js';
import { TRASH_DAYS } from '#lib/trash.js';

const DAY_MS = 86_400_000;

/** A recipe deleted at or before this moment is past restoring. */
export function trashCutoff(now = new Date()): Date {
	return new Date(now.getTime() - TRASH_DAYS * DAY_MS);
}

/**
 * `userId`'s recipes in the Trash that can still be restored, as a condition
 * on `recipes`. Every Trash read goes through it, so a recipe past the 30
 * days is invisible and unrestorable whether or not the purge has run.
 */
export function inTrashOf(userId: string, now = new Date()): SQL {
	return and(
		eq(recipes.authorId, userId),
		gt(recipes.deletedAt, trashCutoff(now)),
		isNull(recipes.erasedAt)
	) as SQL;
}

/**
 * The owner's recipe in the Trash at `slug`, or null: someone else's, a live
 * one and one past the 30 days are all not found. ownRecipe's counterpart for
 * the Trash's actions, which ownRecipe (live recipes only) cannot see.
 */
export async function trashedRecipe(slug: string, userId: string, now = new Date()) {
	const [row] = await db
		.select({ id: recipes.id, slug: recipes.slug, title: recipes.title })
		.from(recipes)
		.where(and(eq(recipes.slug, slug), inTrashOf(userId, now)))
		.limit(1);
	return row ?? null;
}

/** A Trash row's two facts: how long ago it was deleted, and the days left to restore it. */
export function trashAge(deletedAt: Date, now = new Date()) {
	const days = Math.floor((now.getTime() - deletedAt.getTime()) / DAY_MS);
	return {
		deleted: days === 0 ? 'Deleted today' : `Deleted ${plural(days, 'day')} ago`,
		left: `${plural(TRASH_DAYS - days, 'day')} left`
	};
}

/**
 * Permanent: the row, every version and its tag links and saves (by FK
 * cascade), then the photos. Forks keep their parentId and say the original
 * was deleted; Journal entries keep their recipe id and say the same. Only a
 * recipe still in the Trash goes: one restored meanwhile is left alone.
 *
 * While savers keep copies (copyVersion, keptCopies.ts) the recipe is erased
 * instead: the row and the versions they keep stay, for them alone, and every
 * other version, tag link, save and collection link goes, with the photos no
 * kept version shows. Run again once the last copy is removed, it deletes the rest.
 */
export async function deleteForever(recipeId: number, supabase: SupabaseClient): Promise<void> {
	// The save action's row lock: a save waits, then finds no row and removes
	// its own upload, so every version's photo is in the read below.
	const urls = await db.transaction(async (tx) => {
		const [locked] = await tx
			.select({ deletedAt: recipes.deletedAt })
			.from(recipes)
			.where(eq(recipes.id, recipeId))
			.for('update');
		if (!locked?.deletedAt) return [];
		const versions = await tx.query.recipeVersions.findMany({
			where: eq(recipeVersions.recipeId, recipeId),
			columns: { imageUrl: true }
		});
		const copies = await tx
			.select({ userId: favorites.userId, version: favorites.copyVersion })
			.from(favorites)
			.where(and(eq(favorites.recipeId, recipeId), isNotNull(favorites.copyVersion)));
		if (copies.length === 0) {
			await tx.delete(recipes).where(eq(recipes.id, recipeId));
		} else {
			const keepers = copies.map((c) => c.userId);
			const othersCollections = new QueryBuilder()
				.select({ id: collections.id })
				.from(collections)
				.where(notInArray(collections.ownerId, keepers));
			await tx.delete(recipeVersions).where(
				and(
					eq(recipeVersions.recipeId, recipeId),
					notInArray(
						recipeVersions.versionNumber,
						copies.map((c) => c.version!)
					)
				)
			);
			await tx.delete(recipesToTags).where(eq(recipesToTags.recipeId, recipeId));
			await tx
				.delete(favorites)
				.where(and(eq(favorites.recipeId, recipeId), isNull(favorites.copyVersion)));
			await tx
				.delete(collectionRecipes)
				.where(
					and(
						eq(collectionRecipes.recipeId, recipeId),
						inArray(collectionRecipes.collectionId, othersCollections)
					)
				);
			// The row's copies of the latest are the author's, perhaps written after
			// the withdrawal: blanked, so the row holds nothing a saver was not given.
			// Each saver reads their own kept version.
			await tx
				.update(recipes)
				.set({
					erasedAt: new Date(),
					title: '',
					description: null,
					imageUrl: null,
					servings: null,
					prepTimeMinutes: null,
					cookTimeMinutes: null
				})
				.where(eq(recipes.id, recipeId));
		}
		return [...new Set(versions.flatMap((v) => v.imageUrl ?? []))];
	});

	// A fork's first version copies its parent's photo url, so a photo can be
	// shown by other recipes; only the ones no remaining version shows go.
	// Asked after the delete, so this recipe's own versions are not counted.
	// ponytail: a fork committed between the delete and this read can still
	// lose its photo; a lock shared with the fork action closes that if needed.
	if (urls.length > 0) {
		const shown = await db
			.selectDistinct({ imageUrl: recipeVersions.imageUrl })
			.from(recipeVersions)
			.where(inArray(recipeVersions.imageUrl, urls));
		const stillShown = new Set(shown.map((r) => r.imageUrl));
		const paths = urls
			.filter((url) => !stillShown.has(url))
			.flatMap((url) => imagePathOf(url) ?? []);
		if (paths.length > 0) await removeRecipeImage(supabase, ...paths);
	}
}

/** The least time between two purges on one server instance. */
export const PURGE_EVERY_MS = 3_600_000;

let lastPurge = -Infinity;

/**
 * Deletes for good every recipe, any owner's, in the Trash longer than
 * TRASH_DAYS, and every erased one no saver keeps a copy of any more. Called by the Cookbook and Trash loads; a failure is logged and
 * the page loads regardless.
 *
 * ponytail: opportunistic, at most once an hour per server instance, so
 * nothing is purged while nobody opens a Cookbook, and photos are removed
 * through the visitor's Supabase client, which Storage policy may refuse for
 * another owner's folder (the file is then orphaned, and logged). Upgrade: a
 * scheduled job (pg_cron or a Netlify scheduled function) with a service
 * client. Correctness never waits on it: inTrashOf already stops at the 30 days.
 */
export async function purgeExpiredTrash(supabase: SupabaseClient, now = new Date()): Promise<void> {
	if (now.getTime() - lastPurge < PURGE_EVERY_MS) return;
	lastPurge = now.getTime();
	try {
		// Also an erased recipe whose last copy went without removeCopy (the
		// saver's profile deleted, a crash before its deleteForever).
		const copied = new QueryBuilder()
			.select({ id: favorites.recipeId })
			.from(favorites)
			.where(isNotNull(favorites.copyVersion));
		const expired = await db
			.select({ id: recipes.id })
			.from(recipes)
			.where(
				or(
					and(lte(recipes.deletedAt, trashCutoff(now)), isNull(recipes.erasedAt)),
					and(isNotNull(recipes.erasedAt), notInArray(recipes.id, copied))
				)
			);
		for (const { id } of expired) await deleteForever(id, supabase);
	} catch (e) {
		console.error('Could not purge the Trash', e);
	}
}
