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

/** The same rule as canView, as a query condition on `recipes`. */
export function visibleTo(user: Viewer): SQL {
	if (!user) return eq(recipes.visibility, 'public');
	const authorIsFriend = sql`exists (select 1 from ${friendships} where ${friendships.status} = ${ACCEPTED} and ((${friendships.requesterId} = ${user.id} and ${friendships.addresseeId} = ${recipes.authorId}) or (${friendships.addresseeId} = ${user.id} and ${friendships.requesterId} = ${recipes.authorId})))`;
	return or(
		eq(recipes.visibility, 'public'),
		eq(recipes.authorId, user.id),
		and(eq(recipes.visibility, 'friends'), authorIsFriend)
	) as SQL;
}

/**
 * Forks never widen access: a fork may be set no wider than its parent is now.
 * `parent` is null for a recipe that is not a fork, or whose parent was deleted.
 */
export function canSetVisibility(parent: Visibility | null, requested: Visibility): boolean {
	return parent === null || VISIBILITIES.indexOf(requested) <= VISIBILITIES.indexOf(parent);
}
