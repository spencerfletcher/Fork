import { and, eq, or, sql, type SQL } from 'drizzle-orm';
import { db } from './db/index.js';
import { friendships, recipes, type FriendshipStatus } from './db/schema.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';

type Viewer = { id: string } | null | undefined;
type Row = { visibility: Visibility; authorId: string | null };

const ACCEPTED: FriendshipStatus = 'accepted';

/**
 * A recipe is visible when it is public, the viewer wrote it, or it is shared
 * with friends and its author is one of `friendIds` (the viewer's accepted
 * friends, from friendIdsOf).
 */
export function canView(row: Row, user: Viewer, friendIds: string[] = []): boolean {
	if (row.visibility === 'public') return true;
	if (!user || row.authorId === null) return false;
	if (row.authorId === user.id) return true;
	return row.visibility === 'friends' && friendIds.includes(row.authorId);
}

/** canView for one loaded row, looking the viewer's friends up only when the answer depends on them. */
export async function canViewRow(row: Row, user: Viewer): Promise<boolean> {
	const needsFriends =
		row.visibility === 'friends' && user && row.authorId !== null && row.authorId !== user.id;
	return canView(row, user, needsFriends ? await friendIdsOf(user.id) : []);
}

/** The ids of everyone with an accepted friendship with `userId`, whichever of them asked. */
export async function friendIdsOf(userId: string): Promise<string[]> {
	const rows = await db
		.select({ requesterId: friendships.requesterId, addresseeId: friendships.addresseeId })
		.from(friendships)
		.where(
			and(
				eq(friendships.status, ACCEPTED),
				or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
			)
		);
	return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

// A friendships column on the subquery's alias, by name. As a column object it
// would be re-aliased to the root table by db.query's where, becoming "recipes"."status".
const fr = (column: { name: string }) => sql`"fr".${sql.identifier(column.name)}`;

/** The same rule as canView, as a query condition on `recipes`. */
export function visibleTo(user: Viewer): SQL {
	if (!user) return eq(recipes.visibility, 'public');
	const authorIsFriend = sql`exists (select 1 from ${friendships} "fr" where ${fr(friendships.status)} = ${ACCEPTED} and ((${fr(friendships.requesterId)} = ${user.id} and ${fr(friendships.addresseeId)} = ${recipes.authorId}) or (${fr(friendships.addresseeId)} = ${user.id} and ${fr(friendships.requesterId)} = ${recipes.authorId})))`;
	return or(
		eq(recipes.visibility, 'public'),
		eq(recipes.authorId, user.id),
		and(eq(recipes.visibility, 'friends'), authorIsFriend)
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
