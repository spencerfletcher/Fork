import type { User } from '@supabase/supabase-js';
import { and, asc, eq, gt, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db, type Tx } from './db/index.js';
import { formerUsernames, profiles } from './db/schema.js';
import { randomSuffix } from '#lib/helpers.js';
import { FORMER_USERNAME_DAYS, USERNAME_CHANGES_PER_WINDOW } from '#lib/auth/rules.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// A former name counts (redirects, stays reserved, counts towards the limit)
// for FORMER_USERNAME_DAYS from when it was given up. Every reader filters on
// it, so an expired row left in the table changes nothing.
const formerStart = () => sql`now() - make_interval(days => ${FORMER_USERNAME_DAYS}::int)`;
const liveFormer = () => gt(formerUsernames.createdAt, formerStart());

/**
 * Guarantees a profile row for an authenticated user before they write
 * anything. Sign-up passes the username the user chose; a user from before
 * that field gets the email's local part. When another account already took
 * it, a short random suffix is added rather than silently leaving the user
 * without a profile (which would fail every later recipe insert on its
 * foreign key). Another cook's still-reserved former name goes straight to
 * the suffix too, which the insert's conflict alone would not catch.
 *
 * Safe to call twice at once: a conflict on the id means the other call won,
 * which is success; only a conflict on the username earns a retry.
 */
export async function ensureProfile(user: User, username?: string): Promise<void> {
	const base = username ?? user.email?.split('@')[0] ?? user.id.slice(0, 8);
	if (!(await heldAsFormer(base, user.id)) && (await tryInsert(user.id, base))) return;
	if (await hasProfile(user.id)) return;
	if (await tryInsert(user.id, `${base}-${randomSuffix().slice(0, 4)}`)) return;
	if (await hasProfile(user.id)) return;
	throw new Error(`Could not create a profile for ${user.id}`);
}

/** True when the row was inserted; false on any conflict (id or username). */
async function tryInsert(id: string, username: string): Promise<boolean> {
	const inserted = await db
		.insert(profiles)
		.values({ id, username })
		.onConflictDoNothing()
		.returning({ id: profiles.id });
	return inserted.length > 0;
}

/** Whether `username` is someone else's former name, still reserved to them. */
async function heldAsFormer(
	username: string,
	self: string | undefined,
	conn: Tx | typeof db = db
): Promise<boolean> {
	const former = await conn.query.formerUsernames.findFirst({
		where: and(eq(formerUsernames.username, username), liveFormer()),
		columns: { profileId: true }
	});
	return !!former && former.profileId !== self;
}

/**
 * Whether `username` belongs to anyone but `self`: as their current name, or a
 * former one, which stays reserved to its last owner for FORMER_USERNAME_DAYS
 * so nobody can pick up their old links.
 */
export async function usernameTaken(
	username: string,
	self?: string,
	conn: Tx | typeof db = db
): Promise<boolean> {
	const [current, former] = await Promise.all([
		conn.query.profiles.findFirst({
			where: eq(profiles.username, username),
			columns: { id: true }
		}),
		heldAsFormer(username, self, conn)
	]);
	return (!!current && current.id !== self) || former;
}

export type UsernameChange =
	{ result: 'changed' } | { result: 'taken' } | { result: 'too_soon'; nextChange: Date };

/**
 * Renames profile `id`. Everything is keyed by the profile id, so recipes,
 * friends, the Journal and saves follow. The old name is kept as a former one
 * (old links redirect, and it stays reserved) for FORMER_USERNAME_DAYS.
 *
 * The limit: a cook's live former names are their recent changes, so a new
 * name is refused once they hold USERNAME_CHANGES_PER_WINDOW of them. Taking
 * an own former name back is always allowed: it swaps that row for the name
 * left, so the count stays the same. Cycling through undos therefore never
 * frees a slot; only a former name's expiry does.
 */
export async function changeUsername(
	id: string,
	username: string,
	conn: Tx | typeof db = db
): Promise<UsernameChange> {
	if (await usernameTaken(username, id, conn)) return { result: 'taken' };
	try {
		return await conn.transaction(async (tx): Promise<UsernameChange> => {
			const [row] = await tx
				.select({ username: profiles.username })
				.from(profiles)
				.where(eq(profiles.id, id))
				.for('update');
			if (!row || row.username === username) return { result: 'changed' };
			// Expired rows reserve nothing; clearing them frees their keys for the next owner.
			await tx.delete(formerUsernames).where(lte(formerUsernames.createdAt, formerStart()));
			const recent = await tx
				.select({ username: formerUsernames.username, createdAt: formerUsernames.createdAt })
				.from(formerUsernames)
				.where(eq(formerUsernames.profileId, id))
				.orderBy(asc(formerUsernames.createdAt));
			const undo = recent.some((r) => r.username === username);
			if (!undo && recent.length >= USERNAME_CHANGES_PER_WINDOW) {
				// The change that frees the slot is the one this many back from the newest.
				const freeing = recent[recent.length - USERNAME_CHANGES_PER_WINDOW];
				const nextChange = new Date(freeing.createdAt.getTime() + FORMER_USERNAME_DAYS * DAY_MS);
				return { result: 'too_soon', nextChange };
			}
			await tx
				.delete(formerUsernames)
				.where(and(eq(formerUsernames.username, username), eq(formerUsernames.profileId, id)));
			await tx.insert(formerUsernames).values({ username: row.username, profileId: id });
			await tx.update(profiles).set({ username }).where(eq(profiles.id, id));
			return { result: 'changed' };
		});
	} catch (e) {
		// Someone took it between the check and the write.
		if (uniqueViolation(e)) return { result: 'taken' };
		throw e;
	}
}

export const uniqueViolation = (e: unknown): boolean => {
	const pgError = e instanceof Error && e.cause ? e.cause : e;
	return (pgError as { code?: string } | null)?.code === '23505';
};

/**
 * The profile a username in a URL or an @handle points at, as a where clause:
 * the profile with that name now, or the one that gave it up within
 * FORMER_USERNAME_DAYS (after that the old link finds nobody). A caller that
 * finds a different current name redirects or reads on as that profile.
 */
export function namedBy(username: string): SQL {
	return or(
		eq(profiles.username, username),
		inArray(
			profiles.id,
			new QueryBuilder()
				.select({ id: formerUsernames.profileId })
				.from(formerUsernames)
				.where(and(eq(formerUsernames.username, username), liveFormer()))
		)
	)!;
}

async function hasProfile(id: string): Promise<boolean> {
	const row = await db.query.profiles.findFirst({
		where: eq(profiles.id, id),
		columns: { id: true }
	});
	return row !== undefined;
}
