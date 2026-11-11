import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db, type Tx } from './db/index.js';
import { collectionRecipes, collections, profiles, recipes } from './db/schema.js';
import { inLibraryOf } from './visibility.js';
import { uniqueViolation } from './profiles.js';
import { COLLECTION_NAME_ERROR, STARTER_COLLECTIONS, collectionName } from '#lib/collections.js';

type Conn = Tx | typeof db;
type Cook = { id: string };

/** A cook's collection, counting the recipes in it they can still see; `has` says whether one asked-about recipe is in it. */
export type CollectionRow = { id: number; name: string; count: number; has: boolean };

/**
 * The starter collections, once per cook: the profile's stamp says they were
 * made, so a starter the cook deleted is not made again.
 */
async function makeStarters(userId: string, conn: Conn) {
	await conn.transaction(async (tx) => {
		const [first] = await tx
			.update(profiles)
			.set({ startersMadeAt: new Date() })
			.where(and(eq(profiles.id, userId), isNull(profiles.startersMadeAt)))
			.returning({ id: profiles.id });
		if (!first) return;
		await tx
			.insert(collections)
			.values(STARTER_COLLECTIONS.map((name) => ({ ownerId: userId, name })))
			.onConflictDoNothing();
	});
}

/**
 * The cook's collections, oldest first, each counting only recipes still in
 * their library (live, and their own or saved and visible). With `recipeId`,
 * each also says whether that recipe is in it. Makes the starters first.
 */
export async function collectionsOf(
	user: Cook,
	recipeId?: number,
	conn: Conn = db
): Promise<CollectionRow[]> {
	await makeStarters(user.id, conn);
	return conn
		.select({
			id: collections.id,
			name: collections.name,
			count: sql<number>`count(${recipes.id})::int`,
			has: sql<boolean>`coalesce(bool_or(${recipes.id} = ${recipeId ?? null}), false)`
		})
		.from(collections)
		.leftJoin(collectionRecipes, eq(collectionRecipes.collectionId, collections.id))
		.leftJoin(recipes, and(eq(recipes.id, collectionRecipes.recipeId), inLibraryOf(user)))
		.where(eq(collections.ownerId, user.id))
		.groupBy(collections.id)
		.orderBy(asc(collections.createdAt), asc(collections.id));
}

/** The ids of the recipes in the cook's collection they can still see, or null when it is not theirs. */
export async function recipeIdsIn(
	user: Cook,
	collectionId: number,
	conn: Conn = db
): Promise<number[] | null> {
	const [owned] = await conn
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.ownerId, user.id)));
	if (!owned) return null;
	const rows = await conn
		.select({ id: recipes.id })
		.from(collectionRecipes)
		.innerJoin(recipes, eq(recipes.id, collectionRecipes.recipeId))
		.where(and(eq(collectionRecipes.collectionId, collectionId), inLibraryOf(user)));
	return rows.map((r) => r.id);
}

/** A new collection, or why the name is refused. */
export async function createCollection(
	userId: string,
	rawName: string,
	conn: Conn = db
): Promise<{ id: number } | { error: string }> {
	const checked = collectionName(rawName);
	if ('error' in checked) return checked;
	try {
		// Its own transaction (a savepoint inside the caller's), so a refused
		// name leaves the caller's transaction usable.
		const [row] = await conn.transaction((tx) =>
			tx
				.insert(collections)
				.values({ ownerId: userId, name: checked.name })
				.returning({ id: collections.id })
		);
		return row;
	} catch (e) {
		if (uniqueViolation(e)) return { error: COLLECTION_NAME_ERROR.taken(checked.name) };
		throw e;
	}
}

/** Renames the cook's collection; `renamed: false` when it is not theirs. */
export async function renameCollection(
	userId: string,
	id: number,
	rawName: string,
	conn: Conn = db
): Promise<{ renamed: boolean } | { error: string }> {
	const checked = collectionName(rawName);
	if ('error' in checked) return checked;
	try {
		const rows = await conn.transaction((tx) =>
			tx
				.update(collections)
				.set({ name: checked.name })
				.where(and(eq(collections.id, id), eq(collections.ownerId, userId)))
				.returning({ id: collections.id })
		);
		return { renamed: rows.length > 0 };
	} catch (e) {
		if (uniqueViolation(e)) return { error: COLLECTION_NAME_ERROR.taken(checked.name) };
		throw e;
	}
}

/** Deletes the cook's collection and its memberships; its recipes stay. False when it is not theirs. */
export async function deleteCollection(userId: string, id: number, conn: Conn = db) {
	const rows = await conn
		.delete(collections)
		.where(and(eq(collections.id, id), eq(collections.ownerId, userId)))
		.returning({ id: collections.id });
	return rows.length > 0;
}

/**
 * Puts a recipe in the cook's collection or takes it out. False when the
 * collection is not theirs, or (to add) the recipe is not in their library.
 */
export async function setMembership(
	user: Cook,
	collectionId: number,
	recipeId: number,
	member: boolean,
	conn: Conn = db
): Promise<boolean> {
	const [owned] = await conn
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.ownerId, user.id)));
	if (!owned) return false;
	const where = and(
		eq(collectionRecipes.collectionId, collectionId),
		eq(collectionRecipes.recipeId, recipeId)
	);
	if (!member) {
		await conn.delete(collectionRecipes).where(where);
		return true;
	}
	const [inLibrary] = await conn
		.select({ id: recipes.id })
		.from(recipes)
		.where(and(eq(recipes.id, recipeId), inLibraryOf(user)));
	if (!inLibrary) return false;
	await conn.insert(collectionRecipes).values({ collectionId, recipeId }).onConflictDoNothing();
	return true;
}

/** Takes a recipe out of every one of the cook's collections: an unsave, so a later save starts clean. */
export async function leaveCollections(userId: string, recipeId: number, conn: Conn = db) {
	const own = new QueryBuilder()
		.select({ id: collections.id })
		.from(collections)
		.where(eq(collections.ownerId, userId));
	await conn
		.delete(collectionRecipes)
		.where(
			and(eq(collectionRecipes.recipeId, recipeId), inArray(collectionRecipes.collectionId, own))
		);
}
