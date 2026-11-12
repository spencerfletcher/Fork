import { error } from '@sveltejs/kit';
import {
	and,
	eq,
	inArray,
	isNotNull,
	isNull,
	or,
	sql,
	type BuildQueryResult,
	type DBQueryConfig,
	type ExtractTablesWithRelations,
	type SQL,
	type SQLWrapper
} from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db, type Tx } from './db/index.js';
import * as schema from './db/schema.js';
import {
	favorites,
	friendships,
	recipes,
	recipeVersions,
	type FriendshipStatus
} from './db/schema.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';
import { isModerator } from './moderation.js';

/** Whoever is reading: a signed-in user, or nobody. */
export type Viewer = { id: string } | null | undefined;
type Row = {
	visibility: Visibility;
	authorId: string | null;
	deletedAt: Date | null;
	suppressedAt: Date | null;
};

/**
 * A recipe is visible when it is not in the Trash and it is public, the viewer
 * wrote it, or it is shared with friends and its author is one of `friendIds`
 * (the viewer's accepted friends, from friendIdsOf). A trashed recipe is seen
 * by nobody, its owner included: only the Trash (trash.ts) reads it. One a
 * moderator hid (suppressedAt) is seen only by its author, and by moderators
 * among those who could see it otherwise.
 */
export function canView(row: Row, user: Viewer, friendIds: string[] = []): boolean {
	if (row.deletedAt) return false;
	if (row.suppressedAt && !(user && (row.authorId === user.id || isModerator(user)))) return false;
	if (row.visibility === 'public') return true;
	if (!user || row.authorId === null) return false;
	if (row.authorId === user.id) return true;
	return row.visibility === 'friends' && friendIds.includes(row.authorId);
}

/** The viewer's friend ids, fetched on the first call and never again, so one request asks once. */
export function friendIdsOnce(user: Viewer): () => Promise<string[]> {
	let ids: Promise<string[]> | undefined;
	return () => (ids ??= user ? friendIdsOf(user.id) : Promise.resolve([]));
}

/** canView for one loaded row, looking the viewer's friends up only when the answer depends on them. */
export async function canViewRow(
	row: Row,
	user: Viewer,
	friends: () => Promise<string[]> = friendIdsOnce(user)
): Promise<boolean> {
	const needsFriends =
		row.visibility === 'friends' && user && row.authorId !== null && row.authorId !== user.id;
	return canView(row, user, needsFriends ? await friends() : []);
}

/** A fork's parent's author by handle: that one column of their profile, current after a rename. */
export const PARENT_AUTHOR = { columns: { username: true } } as const;

/**
 * A fork's parent as `user` may know it: the row when they may open it, else
 * null, and whether it was deleted. parentId has no FK, so a deleted parent
 * leaves it pointing at no row; one in the Trash reads as deleted too, until
 * it is restored. The byline and v1's line (`withForkLine`) both read this.
 */
export async function lineageFor<P extends Row>(
	recipe: { parentId: number | null; parent: P | null },
	user: Viewer,
	friends: () => Promise<string[]> = friendIdsOnce(user)
): Promise<{ parent: P | null; parentDeleted: boolean }> {
	const visible = recipe.parent !== null && (await canViewRow(recipe.parent, user, friends));
	return {
		parent: visible ? recipe.parent : null,
		parentDeleted: recipe.parentId !== null && (recipe.parent === null || !!recipe.parent.deletedAt)
	};
}

type Schema = ExtractTablesWithRelations<typeof schema>;
type RecipeWith = NonNullable<DBQueryConfig<'one', true, Schema, Schema['recipes']>['with']>;
type RecipeRow<W extends RecipeWith> = BuildQueryResult<Schema, Schema['recipes'], { with: W }>;

/** The live recipe at `slug`: one in the Trash is not found, for its owner too. */
async function recipeBySlug<W extends RecipeWith>(slug: string, withRelations?: W) {
	const row = await db.query.recipes.findFirst({
		where: and(eq(recipes.slug, slug), isNull(recipes.deletedAt)),
		with: withRelations
	});
	// findFirst cannot carry a generic `with` through to its result type.
	return row as RecipeRow<W> | undefined;
}

/** The recipe at `slug` with `withRelations`, or null when there is none or the viewer may not see it. */
export async function viewableRecipe<W extends RecipeWith>(
	slug: string,
	user: Viewer,
	withRelations?: W,
	friends: () => Promise<string[]> = friendIdsOnce(user)
): Promise<RecipeRow<W> | null> {
	const recipe = await recipeBySlug(slug, withRelations);
	return recipe && (await canViewRow(recipe, user, friends)) ? recipe : null;
}

/** What anyone but a recipe's author is told when they try to change it. */
export const NOT_AUTHORIZED = 'Not authorized';

/** The recipe at `slug` when `userId` wrote it: a 404 when there is none, a 403 for anyone else. */
export async function ownRecipe<W extends RecipeWith>(
	slug: string,
	userId: string,
	withRelations?: W
): Promise<RecipeRow<W>> {
	const recipe = await recipeBySlug(slug, withRelations);
	if (!recipe) throw error(404, 'Recipe not found');
	if (recipe.authorId !== userId) throw error(403, NOT_AUTHORIZED);
	return recipe;
}

/** The ids of everyone `userId` has a friendships row in `status` with, whichever way round. */
async function pairedWith(
	userId: string,
	status: FriendshipStatus,
	conn: Tx | typeof db
): Promise<string[]> {
	const rows = await conn
		.select({ requesterId: friendships.requesterId, addresseeId: friendships.addresseeId })
		.from(friendships)
		.where(
			and(
				eq(friendships.status, status),
				or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
			)
		);
	return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/** The ids of everyone with an accepted friendship with `userId`, whichever of them asked. */
export function friendIdsOf(userId: string, conn: Tx | typeof db = db): Promise<string[]> {
	return pairedWith(userId, 'accepted', conn);
}

/** The ids of everyone in a block with `userId`, whichever of them blocked. */
export function blockedIdsOf(userId: string, conn: Tx | typeof db = db): Promise<string[]> {
	return pairedWith(userId, 'blocked', conn);
}

/**
 * A friendships column on a subquery's alias, by name. As a column object it
 * would be re-aliased to the root table by db.query's where, becoming "recipes"."status".
 */
export const onAlias = (alias: string, column: { name: string }) =>
	sql`${sql.identifier(alias)}.${sql.identifier(column.name)}`;

/**
 * The friendships row `[requester, addressee]` is between `a` and `b`,
 * whichever of them asked: the pair index's own least/greatest expressions.
 */
export function eitherWay(
	[requester, addressee]: [SQLWrapper, SQLWrapper],
	a: SQLWrapper | string,
	b: SQLWrapper | string
): SQL {
	return sql`(least(${requester}, ${addressee}) = least(${a}, ${b}) and greatest(${requester}, ${addressee}) = greatest(${a}, ${b}))`;
}

/** `a` and `b` are in a block, whichever of them blocked, as a query condition. */
export function inBlock(a: SQLWrapper | string, b: SQLWrapper | string): SQL {
	const bk = (column: { name: string }) => onAlias('bk', column);
	return sql`exists (select 1 from ${friendships} "bk" where ${bk(friendships.status)} = ${'blocked' satisfies FriendshipStatus} and ${eitherWay([bk(friendships.requesterId), bk(friendships.addresseeId)], a, b)})`;
}

/**
 * The recipe's author has an accepted friendship with `userId`, whichever of
 * them asked, as a query condition on `recipes`. visibleTo's friends rule, and
 * the Friends filter on Discover and Search, which pair it with visibleTo: it
 * narrows by author only and says nothing about what the viewer may see.
 */
export function authorIsFriendOf(userId: string): SQL {
	const fr = (column: { name: string }) => onAlias('fr', column);
	const pair: [SQL, SQL] = [fr(friendships.requesterId), fr(friendships.addresseeId)];
	return sql`exists (select 1 from ${friendships} "fr" where ${fr(friendships.status)} = ${'accepted' satisfies FriendshipStatus} and ${eitherWay(pair, userId, recipes.authorId)})`;
}

/**
 * The same rule as canView, as a query condition on `recipes`: never a recipe
 * in the Trash, and of the ones a moderator hid only the viewer's own (all of
 * them, for a moderator).
 */
export function visibleTo(user: Viewer): SQL {
	const live = isNull(recipes.deletedAt);
	const shown = isNull(recipes.suppressedAt);
	if (!user) return and(live, shown, eq(recipes.visibility, 'public')) as SQL;
	return and(
		live,
		isModerator(user) ? undefined : or(shown, eq(recipes.authorId, user.id)),
		or(
			eq(recipes.visibility, 'public'),
			eq(recipes.authorId, user.id),
			and(eq(recipes.visibility, 'friends'), authorIsFriendOf(user.id))
		)
	) as SQL;
}

/**
 * The recipes `user` keeps a read-only copy of, as a condition on `recipes`:
 * ones they saved that the author has since withdrawn (made private, or moved
 * to the Trash, erased included) while they could see it, which set the save's
 * copyVersion (grantKeptCopies, keptCopies.ts). The copy is that one version,
 * for the saver alone; it never makes the recipe visible (visibleTo), and a
 * recipe narrowed to Friends or lost by an unfriend is not withdrawn. The one
 * rule for copies: one a moderator hid shows none while it is hidden; copies
 * are granted as if it were not (grantKeptCopies), so they return on Restore.
 */
export function keptCopyOf(user: { id: string }): SQL {
	const copied = new QueryBuilder()
		.select({ id: favorites.recipeId })
		.from(favorites)
		.where(and(eq(favorites.userId, user.id), isNotNull(favorites.copyVersion)));
	return and(
		isNull(recipes.suppressedAt),
		or(isNotNull(recipes.deletedAt), eq(recipes.visibility, 'private')),
		inArray(recipes.id, copied)
	) as SQL;
}

/**
 * The recipe at `slug` with `withRelations` when `user` keeps a copy of it,
 * with the one version they keep; null otherwise. viewableRecipe's sibling for
 * the saver's read-only copy: callers try viewableRecipe first. Never pass
 * `versions` in `withRelations`: the copy is the kept version alone.
 */
export async function keptCopy<W extends RecipeWith>(
	slug: string,
	user: Viewer,
	withRelations?: W
): Promise<{ recipe: RecipeRow<W>; version: schema.RecipeVersion } | null> {
	if (!user) return null;
	const row = await db.query.recipes.findFirst({
		where: and(eq(recipes.slug, slug), keptCopyOf(user)),
		with: withRelations
	});
	if (!row) return null;
	const [version] = await db
		.select({ version: recipeVersions })
		.from(recipeVersions)
		.innerJoin(
			favorites,
			and(
				eq(favorites.recipeId, recipeVersions.recipeId),
				eq(favorites.copyVersion, recipeVersions.versionNumber)
			)
		)
		.where(and(eq(favorites.userId, user.id), eq(recipeVersions.recipeId, row.id)));
	// findFirst cannot carry a generic `with` through to its result type.
	return version ? { recipe: row as RecipeRow<W>, version: version.version } : null;
}

/**
 * A viewer's library as a query condition on `recipes`: their own recipes,
 * the ones they saved that they may still see (an author can narrow a recipe
 * or unfriend them after the save), and the copies they keep of saved ones
 * the author withdrew (keptCopyOf). The saves subquery is a builder, not
 * db.select, so it stays SQL inside any query.
 */
export function inLibraryOf(user: { id: string }): SQL {
	const savedIds = new QueryBuilder()
		.select({ id: favorites.recipeId })
		.from(favorites)
		.where(eq(favorites.userId, user.id));
	return or(
		and(visibleTo(user), or(eq(recipes.authorId, user.id), inArray(recipes.id, savedIds))),
		keptCopyOf(user)
	) as SQL;
}

/** What a save that would widen a fork past its parent is told, by the parent's visibility. */
export const WIDENS_PARENT: Record<Exclude<Visibility, 'public'>, string> = {
	friends: "This recipe was forked from one shared with friends, so it can't be made public.",
	private: "This recipe was forked from a private recipe, so it can't be shared."
};

/** What a save is told when the forker can no longer see a Friends parent (an unfriend or block). */
export const LOST_PARENT_ACCESS =
	"This recipe was forked from one you can no longer see, so it can't be shared.";

/**
 * Forks never widen access: a fork may not be set wider than both its parent is
 * now and it is itself now. Staying put or narrowing is always allowed, so a
 * public fork whose parent went private can still move to friends.
 * `parent` is null for a recipe that is not a fork, or whose parent was deleted.
 */
export function canSetVisibility(
	parent: Visibility | null,
	current: Visibility,
	requested: Visibility
): boolean {
	const rank = (v: Visibility) => VISIBILITIES.indexOf(v);
	return parent === null || rank(requested) <= Math.max(rank(parent), rank(current));
}
