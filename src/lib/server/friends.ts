import { alias } from 'drizzle-orm/pg-core';
import { and, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import {
	favorites,
	friendships,
	likes,
	logEntries,
	mutes,
	profiles,
	recipes,
	recipeVersions,
	reports,
	type FriendshipStatus,
	type ReportTarget
} from './db/schema.js';
import type { Tx } from './tags.js';
import { eitherWay, friendIdsOf, onAlias, visibleTo } from './visibility.js';
import { canSeeEntry, sourceColumns, sourceOf } from './journal.js';

type Viewer = { id: string };

/** Where two people stand, from the first one's side. */
export type Relation = 'self' | 'none' | 'sent' | 'received' | 'friends' | 'blocked';

type PairRow = { requesterId: string; addresseeId: string; status: FriendshipStatus };

/**
 * The relation one pair row means for `me`; no row is no relation. Only the
 * blocker is told of a block: the blocked side reads it as no relation.
 */
export function relationFrom(row: PairRow | undefined, me: string): Exclude<Relation, 'self'> {
	if (!row) return 'none';
	if (row.status === 'blocked') return row.requesterId === me ? 'blocked' : 'none';
	if (row.status === 'accepted') return 'friends';
	return row.requesterId === me ? 'sent' : 'received';
}

const pairOf = (a: string, b: string) =>
	eitherWay([friendships.requesterId, friendships.addresseeId], a, b);

/** The one friendships row for a pair, whichever way round it was written. */
async function pairRow(tx: Tx | typeof db, a: string, b: string): Promise<PairRow | undefined> {
	const [row] = await tx
		.select({
			requesterId: friendships.requesterId,
			addresseeId: friendships.addresseeId,
			status: friendships.status
		})
		.from(friendships)
		.where(pairOf(a, b))
		.limit(1);
	return row;
}

export async function relationOf(me: string, them: string): Promise<Relation> {
	if (me === them) return 'self';
	return relationFrom(await pairRow(db, me, them), me);
}

/**
 * Asks `them` to be friends. A request they already sent is accepted instead;
 * any other row (sent, friends, blocked either way) refuses, so a blocked pair
 * can never request.
 */
export async function sendRequest(
	me: string,
	them: string
): Promise<'sent' | 'accepted' | 'refused'> {
	if (me === them) return 'refused';
	return db.transaction(async (tx) => {
		const row = await pairRow(tx, me, them);
		// Checked on the row: the blocked side's relation reads 'none'.
		if (row?.status === 'blocked') return 'refused';
		const relation = relationFrom(row, me);
		if (relation === 'received') {
			await acceptIn(tx, me, them);
			return 'accepted';
		}
		if (relation !== 'none') return 'refused';
		// The pair index refuses a row that raced this one in; when that row is
		// their request to me (crossing requests), accept it as above.
		const inserted = await tx
			.insert(friendships)
			.values({ requesterId: me, addresseeId: them, status: 'pending' })
			.onConflictDoNothing()
			.returning({ requesterId: friendships.requesterId });
		if (inserted.length > 0) return 'sent';
		if (relationFrom(await pairRow(tx, me, them), me) !== 'received') return 'refused';
		await acceptIn(tx, me, them);
		return 'accepted';
	});
}

async function acceptIn(tx: Tx, me: string, them: string) {
	const rows = await tx
		.update(friendships)
		.set({ status: 'accepted' })
		.where(
			and(
				eq(friendships.requesterId, them),
				eq(friendships.addresseeId, me),
				eq(friendships.status, 'pending')
			)
		)
		.returning({ requesterId: friendships.requesterId });
	return rows.length > 0;
}

/** Accepts the request `them` sent `me`, keeping its row; false when there is none. */
export function acceptRequest(me: string, them: string): Promise<boolean> {
	return db.transaction((tx) => acceptIn(tx, me, them));
}

/** Declines the request `them` sent `me`; nothing is kept. */
export async function declineRequest(me: string, them: string): Promise<void> {
	await db
		.delete(friendships)
		.where(
			and(
				eq(friendships.requesterId, them),
				eq(friendships.addresseeId, me),
				eq(friendships.status, 'pending')
			)
		);
}

/**
 * Losing a friend loses access to their Friends recipes, so each side's forks
 * of the other's Friends-level recipes become private. editRevision moves on,
 * so an editor open on the fork cannot save the old audience back.
 */
export async function privatiseForksIn(tx: Tx, a: string, b: string): Promise<void> {
	const parent = alias(recipes, 'parent');
	for (const [owner, forker] of [
		[a, b],
		[b, a]
	]) {
		const friendsRecipes = tx
			.select({ id: parent.id })
			.from(parent)
			.where(and(eq(parent.authorId, owner), eq(parent.visibility, 'friends')));
		await tx
			.update(recipes)
			.set({ visibility: 'private', editRevision: sql`${recipes.editRevision} + 1` })
			.where(
				and(
					eq(recipes.authorId, forker),
					ne(recipes.visibility, 'private'),
					inArray(recipes.parentId, friendsRecipes)
				)
			);
	}
}

/**
 * Unfriend, inside a transaction: the pair's row goes (a pending request too)
 * and the forks are privatised. Saves stay; visibleTo hides them. A block row
 * is never removed here.
 */
export async function unfriendIn(tx: Tx, me: string, them: string): Promise<void> {
	await tx.delete(friendships).where(and(pairOf(me, them), ne(friendships.status, 'blocked')));
	await privatiseForksIn(tx, me, them);
}

export function unfriend(me: string, them: string): Promise<void> {
	return db.transaction((tx) => unfriendIn(tx, me, them));
}

/**
 * Block = unfriend, then the pair's one row says blocked with the blocker as
 * requester. A pair already blocked (either way) stays as it is.
 */
export async function blockIn(tx: Tx, me: string, them: string): Promise<void> {
	if (me === them) return;
	const row = await pairRow(tx, me, them);
	if (row?.status === 'blocked') return;
	await unfriendIn(tx, me, them);
	const blocked = { requesterId: me, addresseeId: them, status: 'blocked' } as const;
	const inserted = await tx
		.insert(friendships)
		.values(blocked)
		.onConflictDoNothing()
		.returning({ requesterId: friendships.requesterId });
	if (inserted.length > 0) return;
	// A request or accept raced in after the unfriend: the block takes the pair's
	// one row, and the forks are privatised again for any friendship it briefly made.
	// A block they raced in first stays theirs.
	const raced = await pairRow(tx, me, them);
	if (!raced || raced.status === 'blocked') return;
	await tx.update(friendships).set(blocked).where(pairOf(me, them));
	await privatiseForksIn(tx, me, them);
}

export function block(me: string, them: string): Promise<void> {
	return db.transaction((tx) => blockIn(tx, me, them));
}

/** Lifts the block `me` put on `them`; a block they put on me stays. */
export async function unblock(me: string, them: string): Promise<void> {
	await db
		.delete(friendships)
		.where(
			and(
				eq(friendships.requesterId, me),
				eq(friendships.addresseeId, them),
				eq(friendships.status, 'blocked')
			)
		);
}

/** Mutes `them` for `me` alone; muting twice is muting once. */
export async function mute(me: string, them: string): Promise<void> {
	if (me === them) return;
	await db.insert(mutes).values({ muterId: me, mutedId: them }).onConflictDoNothing();
}

export const MAX_REPORT = 1000;

/** A report for someone to read by hand. */
export async function report(
	me: string,
	targetType: ReportTarget,
	targetId: string,
	reason: string
): Promise<void> {
	await db.insert(reports).values({ reporterId: me, targetType, targetId, reason });
}

export const OWN_LIKE = "You can't like your own entry.";

/**
 * Likes or unlikes an entry the viewer can see. Seeing it needs an accepted
 * friendship, which a block removes, so a blocked pair cannot like. Nobody
 * likes their own entry.
 */
export async function toggleLike(
	me: Viewer,
	entryId: number
): Promise<{ liked: boolean } | 'refused' | 'own'> {
	const [entry] = await db
		.select({ userId: logEntries.userId, audience: logEntries.audience })
		.from(logEntries)
		.where(eq(logEntries.id, entryId))
		.limit(1);
	if (entry?.userId === me.id) return 'own';
	if (!entry || !canSeeEntry(entry, me, await friendIdsOf(me.id))) return 'refused';
	const removed = await db
		.delete(likes)
		.where(and(eq(likes.userId, me.id), eq(likes.logEntryId, entryId)))
		.returning({ userId: likes.userId });
	if (removed.length > 0) return { liked: false };
	await db.insert(likes).values({ userId: me.id, logEntryId: entryId }).onConflictDoNothing();
	return { liked: true };
}

// A blocked row between the liker and the entry's owner, either way round.
const bk = (column: { name: string }) => onAlias('bk', column);
const likerBlocked = sql`exists (select 1 from ${friendships} "bk" where ${bk(friendships.status)} = ${'blocked' satisfies FriendshipStatus} and ${eitherWay([bk(friendships.requesterId), bk(friendships.addresseeId)], likes.userId, logEntries.userId)})`;

/** Like counts per entry, leaving out likes from anyone the owner blocked or was blocked by. */
export async function likeCounts(
	entryIds: number[],
	ex: Tx | typeof db = db
): Promise<Map<number, number>> {
	if (entryIds.length === 0) return new Map();
	const rows = await ex
		.select({ id: likes.logEntryId, n: count() })
		.from(likes)
		.innerJoin(logEntries, eq(logEntries.id, likes.logEntryId))
		.where(and(inArray(likes.logEntryId, entryIds), sql`not ${likerBlocked}`))
		.groupBy(likes.logEntryId);
	return new Map(rows.map((r) => [r.id, r.n]));
}

/** The friend requests waiting for `me`, newest first. */
export function requestsFor(me: string) {
	return db
		.select({
			id: profiles.id,
			username: profiles.username,
			sentAt: friendships.createdAt
		})
		.from(friendships)
		.innerJoin(profiles, eq(profiles.id, friendships.requesterId))
		.where(and(eq(friendships.addresseeId, me), eq(friendships.status, 'pending')))
		.orderBy(desc(friendships.createdAt));
}

export const FEED_LIMIT = 50;

/**
 * The Friends feed: friends' Friends-level log entries and the versions of
 * their recipes the viewer may see, in one chronology, minus anyone muted.
 * `friendIds` is the viewer's, from friendIdsOf, which the page counts too.
 */
export async function feedFor(me: Viewer, friendIds: string[]) {
	const mutedRows = await db
		.select({ id: mutes.mutedId })
		.from(mutes)
		.where(eq(mutes.muterId, me.id));
	const muted = mutedRows.map((r) => r.id);
	const shown = friendIds.filter((id) => !muted.includes(id));
	if (shown.length === 0) return [];

	const author = alias(profiles, 'author');
	const [entryRows, versionRows] = await Promise.all([
		db
			// Every column but the note, which is the owner's alone and never leaves the server for a friend.
			.select({
				entry: {
					id: logEntries.id,
					userId: logEntries.userId,
					recipeId: logEntries.recipeId,
					dish: logEntries.dish,
					cookedOn: logEntries.cookedOn,
					servings: logEntries.servings,
					photoUrl: logEntries.photoUrl,
					caption: logEntries.caption,
					audience: logEntries.audience,
					sourceUrl: logEntries.sourceUrl,
					createdAt: logEntries.createdAt
				},
				username: profiles.username,
				...sourceColumns
			})
			.from(logEntries)
			.innerJoin(profiles, eq(profiles.id, logEntries.userId))
			.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
			.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
			.where(and(inArray(logEntries.userId, shown), eq(logEntries.audience, 'friends')))
			.orderBy(desc(logEntries.createdAt))
			.limit(FEED_LIMIT),
		db
			.select({
				id: recipeVersions.id,
				versionNumber: recipeVersions.versionNumber,
				at: recipeVersions.createdAt,
				slug: recipes.slug,
				title: recipes.title,
				visibility: recipes.visibility,
				username: author.username
			})
			.from(recipeVersions)
			.innerJoin(recipes, eq(recipes.id, recipeVersions.recipeId))
			.innerJoin(author, eq(author.id, recipes.authorId))
			.where(and(inArray(recipes.authorId, shown), visibleTo(me)))
			.orderBy(desc(recipeVersions.createdAt))
			.limit(FEED_LIMIT)
	]);

	const entryIds = entryRows.map((r) => r.entry.id);
	const recipeIds = entryRows.flatMap((r) => (r.entry.recipeId === null ? [] : [r.entry.recipeId]));
	const [counts, mine, saved] = await Promise.all([
		likeCounts(entryIds),
		entryIds.length
			? db
					.select({ id: likes.logEntryId })
					.from(likes)
					.where(and(eq(likes.userId, me.id), inArray(likes.logEntryId, entryIds)))
			: [],
		recipeIds.length
			? db
					.select({ id: favorites.recipeId })
					.from(favorites)
					.where(and(eq(favorites.userId, me.id), inArray(favorites.recipeId, recipeIds)))
			: []
	]);
	const likedIds = new Set(mine.map((r) => r.id));
	const savedIds = new Set(saved.map((r) => r.id));

	const entries = entryRows.map((row) => ({
		kind: 'entry' as const,
		at: row.entry.createdAt,
		entry: row.entry,
		username: row.username,
		source: sourceOf(
			{ ...row, recipeId: row.entry.recipeId, sourceUrl: row.entry.sourceUrl },
			me,
			friendIds
		),
		likes: counts.get(row.entry.id) ?? 0,
		liked: likedIds.has(row.entry.id),
		saved: row.entry.recipeId !== null && savedIds.has(row.entry.recipeId)
	}));
	const events = versionRows.map((row) => ({ kind: 'event' as const, ...row }));
	return [...entries, ...events]
		.sort((x, y) => y.at.getTime() - x.at.getTime())
		.slice(0, FEED_LIMIT);
}

export type FeedItem = Awaited<ReturnType<typeof feedFor>>[number];
