import type { SupabaseClient } from '@supabase/supabase-js';
import { and, asc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { favorites, formerUsernames, logEntries, profiles, recipes } from './db/schema.js';
import { imagePathOf, removeRecipeImage } from './images.js';
import { removeCopy } from './keptCopies.js';
import { deleteForever, moveToTrash } from './trash.js';

/**
 * Deletes the cook's account the way Delete recipe deletes a recipe, for every
 * one of theirs (Spencer, 11 November 2026: "Same as recipe delete"):
 *
 * 1. Each live recipe goes to the Trash (moveToTrash: savers who may see it
 *    now keep a copy, blocks respected), then each one in the Trash is deleted
 *    for good (deleteForever: erased while copies are kept, else removed;
 *    forks keep their parentId and read "Original recipe deleted").
 * 2. Each save of theirs is removed (removeCopy), finishing an erased recipe
 *    whose last copy was theirs.
 * 3. The profile row, under its lock; its FKs take the rest: collections,
 *    Journal entries and their likes, their likes, friendships, requests and
 *    blocks and mutes cascade; their username joins their former ones, which
 *    stay reserved to no one for FORMER_USERNAME_DAYS; and reports they filed,
 *    recipes.author_id (the erased rows savers keep) and
 *    recipe_versions.created_by are set null.
 * 4. Their Journal photos and avatar are removed from Storage.
 *
 * Every step reads what is left, so a failure part way leaves an account the
 * next call finishes, and a second call does nothing. Each recipe's row is
 * locked first, as every other writer of it locks it. The Supabase auth user
 * is the caller's (the Settings action).
 */
export async function deleteAccount(userId: string, supabase: SupabaseClient): Promise<void> {
	const ownedWhere = (deleted: boolean) =>
		and(
			eq(recipes.authorId, userId),
			isNull(recipes.erasedAt),
			deleted ? isNotNull(recipes.deletedAt) : isNull(recipes.deletedAt)
		);
	const live = await db
		.select({ id: recipes.id, authorId: recipes.authorId })
		.from(recipes)
		.where(ownedWhere(false))
		.orderBy(asc(recipes.id));
	for (const recipe of live) await moveToTrash(recipe);
	const trashed = await db
		.select({ id: recipes.id })
		.from(recipes)
		.where(ownedWhere(true))
		.orderBy(asc(recipes.id));
	for (const { id } of trashed) await deleteForever(id, supabase);

	const saves = await db
		.select({ recipeId: favorites.recipeId })
		.from(favorites)
		.where(eq(favorites.userId, userId))
		.orderBy(asc(favorites.recipeId));
	for (const { recipeId } of saves)
		if (await removeCopy(userId, recipeId)) await deleteForever(recipeId, supabase);

	const photos = await db.transaction(async (tx) => {
		const [profile] = await tx
			.select({ username: profiles.username, avatarUrl: profiles.avatarUrl })
			.from(profiles)
			.where(eq(profiles.id, userId))
			.for('update');
		if (!profile) return [];
		// A recipe written in another tab since the reads above: its insert held
		// the profile's key lock, so it is visible now. Refused, so it is never
		// left live with no author; the next attempt takes it.
		const left = await tx.$count(
			recipes,
			and(eq(recipes.authorId, userId), isNull(recipes.erasedAt))
		);
		if (left > 0) throw new Error(`Account ${userId} gained a recipe while being deleted`);
		const entries = await tx
			.select({ photoUrl: logEntries.photoUrl })
			.from(logEntries)
			.where(and(eq(logEntries.userId, userId), isNotNull(logEntries.photoUrl)));
		// The name stays reserved FORMER_USERNAME_DAYS, as a rename's does: the
		// delete below leaves it, and their former names, owned by no one. A key
		// left by an expired former name is taken over.
		await tx
			.insert(formerUsernames)
			.values({ username: profile.username, profileId: userId })
			.onConflictDoUpdate({
				target: formerUsernames.username,
				set: { profileId: userId, createdAt: sql`now()` }
			});
		await tx.delete(profiles).where(eq(profiles.id, userId));
		return [profile.avatarUrl, ...entries.map((e) => e.photoUrl)];
	});

	// After the commit, so a refusal here loses nothing. ponytail: a failed
	// removal orphans the files (logged), as Storage may refuse the user's own
	// folder locally (no policies); a sweep for files under a folder with no
	// profile, with a service client, would clear them.
	const paths = photos.flatMap((url) => (url ? (imagePathOf(url) ?? []) : []));
	if (paths.length === 0) return;
	try {
		await removeRecipeImage(supabase, ...paths);
	} catch (e) {
		console.error('Could not remove a deleted account’s photos', paths.join(', '), e);
	}
}
