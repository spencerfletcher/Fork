// The writes every save that appends a version shares: the edit form's save
// and Restore. Version history is append-only: these insert a version and
// update the recipe row's copies of it, and never touch an earlier version.
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Tx } from './db/index.js';
import { recipes, recipeVersions, type Recipe, type RecipeVersion } from './db/schema.js';
import {
	changedGroups,
	recipeCopies,
	restoredCommitMessage,
	versionContent
} from '#lib/recipes/content.js';
import type { RecipeContent } from '#lib/recipes/types.js';

/**
 * Locks the recipe row for a save, serialising saves on it, and reads its
 * latest version under the lock; or why the save must stop: the row is gone
 * or no longer `userId`'s, or `editRevision` has moved on since the form loaded.
 */
export async function lockForSave(
	tx: Tx,
	recipeId: number,
	userId: string,
	editRevision: number
): Promise<'forbidden' | 'stale' | { locked: Recipe; latest: RecipeVersion | undefined }> {
	const [locked] = await tx.select().from(recipes).where(eq(recipes.id, recipeId)).for('update');
	if (!locked || locked.authorId !== userId) return 'forbidden';
	if (locked.editRevision !== editRevision) return 'stale';
	const latest = await tx.query.recipeVersions.findFirst({
		where: eq(recipeVersions.recipeId, recipeId),
		orderBy: [desc(recipeVersions.versionNumber)]
	});
	return { locked, latest };
}

/** Inserts `content` as the version after `latest`. */
export async function appendVersion(
	tx: Tx,
	recipeId: number,
	userId: string,
	latest: RecipeVersion | undefined,
	content: RecipeContent,
	commitMessage: string
): Promise<void> {
	await tx.insert(recipeVersions).values({
		recipeId,
		versionNumber: (latest?.versionNumber ?? 0) + 1,
		commitMessage,
		...content,
		createdBy: userId
	});
}

/**
 * Ends a save in one update: the copies when the content changed, any setting
 * that moved, and always the revision bump, so an open form goes stale.
 * Several recipes at once for a setting alone (the Cookbook's bulk tag).
 */
export async function commitSave(
	tx: Tx,
	recipeId: number | number[],
	set: Partial<ReturnType<typeof recipeCopies> & Pick<Recipe, 'visibility'>>
): Promise<void> {
	await tx
		.update(recipes)
		.set({ ...set, editRevision: sql`${recipes.editRevision} + 1`, updatedAt: new Date() })
		.where(Array.isArray(recipeId) ? inArray(recipes.id, recipeId) : eq(recipes.id, recipeId));
}

/**
 * Appends a version carrying version `versionNumber`'s content, as an edit
 * save would, and returns the new number. Only content: the audience and tags
 * are the recipe's settings and stay as they are. The photo url is carried as
 * is: a replaced photo stays in storage while any version shows it (only
 * deleting the recipe removes photos).
 */
export async function restoreVersion(
	tx: Tx,
	recipeId: number,
	userId: string,
	editRevision: number,
	versionNumber: number
): Promise<'forbidden' | 'stale' | 'not_found' | 'unchanged' | { versionNumber: number }> {
	const lock = await lockForSave(tx, recipeId, userId, editRevision);
	if (typeof lock === 'string') return lock;
	const { latest } = lock;

	const source = await tx.query.recipeVersions.findFirst({
		where: and(
			eq(recipeVersions.recipeId, recipeId),
			eq(recipeVersions.versionNumber, versionNumber)
		)
	});
	if (!source || !latest) return 'not_found';

	const content = versionContent(source);
	if (changedGroups(latest, content).length === 0) return 'unchanged';

	await appendVersion(tx, recipeId, userId, latest, content, restoredCommitMessage(versionNumber));
	await commitSave(tx, recipeId, recipeCopies(content));
	return { versionNumber: latest.versionNumber + 1 };
}
