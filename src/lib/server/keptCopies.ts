import { and, eq, inArray, isNotNull, max, notInArray, or, sql } from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import {
	favorites,
	recipeVersions,
	recipes,
	type Recipe,
	type RecipeVersion
} from './db/schema.js';
import { blockedIdsOf, canView, friendIdsOf, keptCopyOf } from './visibility.js';
import { leaveCollections } from './collections.js';

// Keep this version and the copies it leads to (roadmap section 7, "Saves and
// access"). The save row holds the saver's choice (keptVersion), the copy the
// author's withdrawal left them (copyVersion) and their note; the access rule
// for a copy is keptCopyOf in visibility.ts.

/**
 * Called in the transaction that makes a live recipe private or moves it to
 * the Trash, before the change, while it still has its audience. Every saver
 * who can see it now keeps a copy of their kept version, or else the latest;
 * every other saver (one unfriended from a Friends recipe, say) is left with
 * none, whatever an earlier withdrawal gave them. A saver in a block with the
 * author, whichever blocked, keeps none, even of a public recipe (canView reads
 * no blocks). The author's own save is never a copy.
 */
export async function grantKeptCopies(
	tx: Tx | typeof db,
	recipe: Pick<Recipe, 'id' | 'authorId' | 'visibility' | 'suppressedAt'>
): Promise<void> {
	const savers = await tx
		.select({ userId: favorites.userId })
		.from(favorites)
		.where(eq(favorites.recipeId, recipe.id));
	if (savers.length === 0) return;

	// The author's friends are each friend's friend: the friendship has no direction.
	const authorFriends =
		recipe.visibility === 'friends' && recipe.authorId
			? await friendIdsOf(recipe.authorId, tx)
			: [];
	const blocked = recipe.authorId ? await blockedIdsOf(recipe.authorId, tx) : [];
	const live = { ...recipe, deletedAt: null };
	const sees = (userId: string) =>
		userId !== recipe.authorId &&
		!blocked.includes(userId) &&
		canView(live, { id: userId }, authorFriends.includes(userId) ? [recipe.authorId!] : []);
	const viewers = savers.map((s) => s.userId).filter(sees);

	const [{ latest }] = await tx
		.select({ latest: max(recipeVersions.versionNumber) })
		.from(recipeVersions)
		.where(eq(recipeVersions.recipeId, recipe.id));
	const forRecipe = eq(favorites.recipeId, recipe.id);
	if (viewers.length > 0)
		await tx
			.update(favorites)
			.set({ copyVersion: sql`coalesce(${favorites.keptVersion}, ${latest})` })
			.where(and(forRecipe, inArray(favorites.userId, viewers)));
	await tx
		.update(favorites)
		.set({ copyVersion: null })
		.where(viewers.length > 0 ? and(forRecipe, notInArray(favorites.userId, viewers)) : forRecipe);
}

const saveOf = (userId: string, recipeId: number) =>
	and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId));

/**
 * A block ends every copy either of `a` and `b` keeps of the other's recipes,
 * in the block's transaction, after its row is written (so a later withdrawal
 * grants none: grantKeptCopies reads it). The saves stay; with no copy and no
 * access they leave the library. Each recipe's row is locked first, as
 * removeCopy and deleteForever lock it, so an erase never reads a copy this
 * clears. An erased recipe left with no copy is finished by purgeExpiredTrash.
 * Unblocking gives nothing back.
 */
export async function revokeKeptCopies(tx: Tx, a: string, b: string): Promise<void> {
	const heldByOther = or(
		and(eq(recipes.authorId, a), eq(favorites.userId, b)),
		and(eq(recipes.authorId, b), eq(favorites.userId, a))
	);
	const held = await tx
		.select({ recipeId: recipes.id, userId: favorites.userId })
		.from(recipes)
		.innerJoin(favorites, eq(favorites.recipeId, recipes.id))
		.where(and(heldByOther, isNotNull(favorites.copyVersion)))
		.orderBy(recipes.id)
		.for('update', { of: recipes });
	for (const { recipeId, userId } of held)
		await tx.update(favorites).set({ copyVersion: null }).where(saveOf(userId, recipeId));
}

/**
 * Keep `versionNumber` of a recipe the cook saved, or follow the latest again
 * with null. False when they have not saved it or it has no such version.
 * The caller checks they may see the recipe.
 */
export async function keepVersion(
	userId: string,
	recipeId: number,
	versionNumber: number | null,
	conn: Tx | typeof db = db
): Promise<boolean> {
	if (versionNumber !== null) {
		const exists = await conn.$count(
			recipeVersions,
			and(eq(recipeVersions.recipeId, recipeId), eq(recipeVersions.versionNumber, versionNumber))
		);
		if (exists === 0) return false;
	}
	const rows = await conn
		.update(favorites)
		.set({ keptVersion: versionNumber })
		.where(saveOf(userId, recipeId))
		.returning({ recipeId: favorites.recipeId });
	return rows.length > 0;
}

/**
 * The saver removes their copy: the save, its note and its collection places,
 * in one transaction under the recipe's row lock (deleteForever's), so an erase
 * landing meanwhile is read here. True when the recipe is erased and no copy is
 * left: the caller then finishes the erase with deleteForever. A recipe only in
 * the Trash is never finished: it is still its author's to restore.
 */
export async function removeCopy(
	userId: string,
	recipeId: number,
	conn: Tx | typeof db = db
): Promise<boolean> {
	return conn.transaction(async (tx) => {
		const [locked] = await tx
			.select({ erasedAt: recipes.erasedAt })
			.from(recipes)
			.where(eq(recipes.id, recipeId))
			.for('update');
		await tx.delete(favorites).where(saveOf(userId, recipeId));
		await leaveCollections(userId, recipeId, tx);
		if (!locked?.erasedAt) return false;
		const left = await tx.$count(
			favorites,
			and(eq(favorites.recipeId, recipeId), isNotNull(favorites.copyVersion))
		);
		return left === 0;
	});
}

/** The cook's note on a recipe they saved, trimmed; empty clears it. False when they have not saved it. */
export async function setNote(
	userId: string,
	recipeId: number,
	note: string,
	conn: Tx | typeof db = db
): Promise<boolean> {
	const rows = await conn
		.update(favorites)
		.set({ note: note.trim() || null })
		.where(saveOf(userId, recipeId))
		.returning({ recipeId: favorites.recipeId });
	return rows.length > 0;
}

/**
 * For those of `recipeIds` that `user` keeps as copies, the version they keep.
 * A list showing a copy reads its words from here, never from the recipe row,
 * whose copies of the latest version may hold edits the author made after
 * withdrawing it.
 */
export async function keptVersionsOf(
	user: { id: string },
	recipeIds: number[],
	conn: Tx | typeof db = db
): Promise<Map<number, RecipeVersion>> {
	if (recipeIds.length === 0) return new Map();
	const rows = await conn
		.select({ version: recipeVersions })
		.from(recipeVersions)
		.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
		.innerJoin(
			favorites,
			and(
				eq(favorites.recipeId, recipes.id),
				eq(favorites.userId, user.id),
				eq(favorites.copyVersion, recipeVersions.versionNumber)
			)
		)
		.where(and(inArray(recipes.id, recipeIds), keptCopyOf(user)));
	return new Map(rows.map((r) => [r.version.recipeId, r.version]));
}
