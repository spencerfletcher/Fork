import { alias } from 'drizzle-orm/pg-core';
import {
	and,
	desc,
	eq,
	isNotNull,
	isNull,
	ne,
	sql,
	type Column,
	type SQL,
	type SQLWrapper
} from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import {
	favorites,
	friendships,
	likes,
	logEntries,
	mutes,
	profiles,
	recipes
} from './db/schema.js';
import { inBlock, onAlias, visibleTo } from './visibility.js';
import {
	NOTIFICATION_KINDS,
	UNSEEN_MAX,
	mutedKinds,
	type NotificationKind
} from '#lib/notifications.js';

type Conn = Tx | typeof db;
type RecipeRef = { slug: string; title: string };

/**
 * One thing a cook is told. Nothing here is stored: each kind is read from the
 * row the event left (a request, an accept, a like, a save, a fork), so a
 * withdrawn request, an unlike or an unsave takes its item with it. `username`
 * is the actor's current handle, null once their account is gone. `unseen`:
 * newer than the cook last looked (markSeen). The UI groups by kind and target
 * (the entry, the recipe); `id` is unique across kinds.
 */
export type Notification = { id: string; at: Date; unseen: boolean; username: string | null } & (
	| { kind: 'request' | 'accepted' }
	| { kind: 'like'; entry: { id: number; dish: string } }
	| { kind: 'save'; recipe: RecipeRef }
	// `fork` is null when the cook may not open the fork (Only me, or Friends of a non-friend).
	| { kind: 'fork'; recipe: RecipeRef; fork: RecipeRef | null }
);

type Read = { me: string; unseenOnly: boolean; limit: number; conn?: Conn };

/** Nobody in a block with `me` either way, and nobody `me` muted: the person on the row, `actor`. */
function heardFrom(me: string, actor: SQLWrapper): SQL {
	return sql`not ${inBlock(me, actor)} and not exists (select 1 from ${mutes} where ${mutes.muterId} = ${me} and ${mutes.mutedId} = ${actor})`;
}

/**
 * `at` is after the cook last looked, compared in SQL so the stored
 * microseconds are never rounded through a Date. Never looked: all unseen.
 */
function unseenAt(me: string, at: SQLWrapper): SQL<boolean> {
	const seen = onAlias('seen', profiles.notificationsSeenAt);
	return sql<boolean>`(${at} > coalesce((select ${seen} from ${profiles} "seen" where ${onAlias('seen', profiles.id)} = ${me}), '-infinity'::timestamp))`;
}

/** Not in the Trash (erased included: it keeps deleted_at) and not hidden by a moderator. */
const live = (t: { deletedAt: Column; suppressedAt: Column }) =>
	and(isNull(t.deletedAt), isNull(t.suppressedAt));

// Each read below stands on an index that starts with the cook (named on
// each), then sorts the cook's own few rows; the block check reads
// friendships_pair_idx, the mute check the mutes key.

/** Requests waiting for `me`: friendships_addressee_idx. */
export function requestsTo({ me, unseenOnly, limit, conn = db }: Read) {
	return conn
		.select({
			at: friendships.createdAt,
			unseen: unseenAt(me, friendships.createdAt),
			actorId: friendships.requesterId,
			username: profiles.username
		})
		.from(friendships)
		.innerJoin(profiles, eq(profiles.id, friendships.requesterId))
		.where(
			and(
				eq(friendships.addresseeId, me),
				eq(friendships.status, 'pending'),
				heardFrom(me, friendships.requesterId),
				unseenOnly ? unseenAt(me, friendships.createdAt) : undefined
			)
		)
		.orderBy(desc(friendships.createdAt), desc(friendships.requesterId))
		.limit(limit);
}

/** Requests `me` sent that were accepted, by the accept: the friendships key (requester first). */
export function acceptsOf({ me, unseenOnly, limit, conn = db }: Read) {
	return conn
		.select({
			at: friendships.acceptedAt,
			unseen: unseenAt(me, friendships.acceptedAt),
			actorId: friendships.addresseeId,
			username: profiles.username
		})
		.from(friendships)
		.innerJoin(profiles, eq(profiles.id, friendships.addresseeId))
		.where(
			and(
				eq(friendships.requesterId, me),
				eq(friendships.status, 'accepted'),
				isNotNull(friendships.acceptedAt),
				heardFrom(me, friendships.addresseeId),
				unseenOnly ? unseenAt(me, friendships.acceptedAt) : undefined
			)
		)
		.orderBy(desc(friendships.acceptedAt), desc(friendships.addresseeId))
		.limit(limit);
}

/** Likes on `me`'s Journal entries: log_entries_user_idx, then likes_entry_idx. A deleted entry takes its likes. */
export function likesOn({ me, unseenOnly, limit, conn = db }: Read) {
	return conn
		.select({
			at: likes.createdAt,
			unseen: unseenAt(me, likes.createdAt),
			actorId: likes.userId,
			username: profiles.username,
			entryId: logEntries.id,
			dish: logEntries.dish
		})
		.from(likes)
		.innerJoin(logEntries, eq(logEntries.id, likes.logEntryId))
		.innerJoin(profiles, eq(profiles.id, likes.userId))
		.where(
			and(
				eq(logEntries.userId, me),
				ne(likes.userId, me),
				heardFrom(me, likes.userId),
				unseenOnly ? unseenAt(me, likes.createdAt) : undefined
			)
		)
		.orderBy(desc(likes.createdAt), desc(likes.logEntryId), desc(likes.userId))
		.limit(limit);
}

/**
 * Saves of `me`'s live recipes by others: recipes_author_idx, then
 * favorites_recipe_idx. The saver is named: they saved a recipe its author
 * shared with them, and a handle is public.
 */
export function savesOf({ me, unseenOnly, limit, conn = db }: Read) {
	return conn
		.select({
			at: favorites.createdAt,
			unseen: unseenAt(me, favorites.createdAt),
			actorId: favorites.userId,
			username: profiles.username,
			recipeId: recipes.id,
			slug: recipes.slug,
			title: recipes.title
		})
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.innerJoin(profiles, eq(profiles.id, favorites.userId))
		.where(
			and(
				eq(recipes.authorId, me),
				live(recipes),
				ne(favorites.userId, me),
				heardFrom(me, favorites.userId),
				unseenOnly ? unseenAt(me, favorites.createdAt) : undefined
			)
		)
		.orderBy(desc(favorites.createdAt), desc(favorites.recipeId), desc(favorites.userId))
		.limit(limit);
}

/**
 * Live forks by others of `me`'s live recipes, dated by the fork's creation:
 * recipes_author_idx for the parents, then recipes_parent_idx. Always an item,
 * but the fork's title and slug only when visibleTo lets `me` open it. The
 * forker is null once their account is gone.
 */
export function forksOf({ me, unseenOnly, limit, conn = db }: Read) {
	const parent = alias(recipes, 'parent');
	return conn
		.select({
			at: recipes.createdAt,
			unseen: unseenAt(me, recipes.createdAt),
			actorId: recipes.authorId,
			username: profiles.username,
			forkId: recipes.id,
			slug: parent.slug,
			title: parent.title,
			forkSlug: recipes.slug,
			forkTitle: recipes.title,
			forkVisible: sql<boolean>`(${visibleTo({ id: me })})`
		})
		.from(recipes)
		.innerJoin(parent, eq(parent.id, recipes.parentId))
		.leftJoin(profiles, eq(profiles.id, recipes.authorId))
		.where(
			and(
				eq(parent.authorId, me),
				live(parent),
				live(recipes),
				sql`${recipes.authorId} is distinct from ${me}`,
				heardFrom(me, recipes.authorId),
				unseenOnly ? unseenAt(me, recipes.createdAt) : undefined
			)
		)
		.orderBy(desc(recipes.createdAt), desc(recipes.id))
		.limit(limit);
}

async function itemsOf(kind: NotificationKind, read: Read): Promise<Notification[]> {
	const base = (r: { at: Date | null; unseen: boolean; username: string | null }, id: string) => ({
		id,
		// Only acceptedAt is nullable, and acceptsOf keeps it not null.
		at: r.at!,
		unseen: r.unseen,
		username: r.username
	});
	switch (kind) {
		case 'request':
			return (await requestsTo(read)).map((r) => ({ kind, ...base(r, `request-${r.actorId}`) }));
		case 'accepted':
			return (await acceptsOf(read)).map((r) => ({ kind, ...base(r, `accepted-${r.actorId}`) }));
		case 'like':
			return (await likesOn(read)).map((r) => ({
				kind,
				...base(r, `like-${r.entryId}-${r.actorId}`),
				entry: { id: r.entryId, dish: r.dish }
			}));
		case 'save':
			return (await savesOf(read)).map((r) => ({
				kind,
				...base(r, `save-${r.recipeId}-${r.actorId}`),
				recipe: { slug: r.slug, title: r.title }
			}));
		case 'fork':
			return (await forksOf(read)).map((r) => ({
				kind,
				...base(r, `fork-${r.forkId}`),
				recipe: { slug: r.slug, title: r.title },
				fork: r.forkVisible ? { slug: r.forkSlug, title: r.forkTitle } : null
			}));
	}
}

/** Newest first; at one instant (to the millisecond) the higher id, so no two items tie. */
export function newestFirst(a: Notification, b: Notification): number {
	return b.at.getTime() - a.at.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

/** The kinds `userId` has not muted, read from their profile; a stored kind not in the list is ignored. */
async function heardKinds(userId: string, conn: Conn): Promise<NotificationKind[]> {
	const [row] = await conn
		.select({ muted: profiles.mutedNotifications })
		.from(profiles)
		.where(eq(profiles.id, userId));
	const muted = mutedKinds(row?.muted ?? []);
	return NOTIFICATION_KINDS.filter((k) => !muted.includes(k));
}

async function read(user: { id: string }, unseenOnly: boolean, limit: number, conn: Conn) {
	// A muted kind is never read, so it cannot take a place in the limit.
	const kinds = await heardKinds(user.id, conn);
	const lists = await Promise.all(
		kinds.map((kind) => itemsOf(kind, { me: user.id, unseenOnly, limit, conn }))
	);
	return lists.flat().sort(newestFirst).slice(0, limit);
}

/** The newest `limit` things `user` is told about across the kinds they have not muted. */
export function notificationsFor(
	user: { id: string },
	{ limit, conn = db }: { limit: number; conn?: Conn }
): Promise<Notification[]> {
	return read(user, false, limit, conn);
}

/** How many of those are newer than the cook last looked, up to UNSEEN_MAX. */
export async function unseenCount(user: { id: string }, conn: Conn = db): Promise<number> {
	return (await read(user, true, UNSEEN_MAX, conn)).length;
}

/** The cook has looked: everything until now, by the database's clock that dates the events, is seen. */
export async function markSeen(userId: string, conn: Conn = db): Promise<void> {
	await conn
		.update(profiles)
		.set({ notificationsSeenAt: sql`now()` })
		.where(eq(profiles.id, userId));
}
