import type { User } from '@supabase/supabase-js';
import { and, eq, inArray, or, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { db, type Tx } from './db/index.js';
import { formerUsernames, profiles } from './db/schema.js';
import { randomSuffix } from '#lib/helpers.js';

/**
 * Guarantees a profile row for an authenticated user before they write
 * anything. Sign-up passes the username the user chose; a user from before
 * that field gets the email's local part. When another account already took
 * it, a short random suffix is added rather than silently leaving the user
 * without a profile (which would fail every later recipe insert on its
 * foreign key).
 *
 * Safe to call twice at once: a conflict on the id means the other call won,
 * which is success; only a conflict on the username earns a retry.
 */
export async function ensureProfile(user: User, username?: string): Promise<void> {
	const base = username ?? user.email?.split('@')[0] ?? user.id.slice(0, 8);
	if (await tryInsert(user.id, base)) return;
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

/**
 * Whether `username` belongs to anyone but `self`: as their current name, or a
 * former one, which stays reserved to its last owner so nobody can pick up
 * their old links.
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
		conn.query.formerUsernames.findFirst({
			where: eq(formerUsernames.username, username),
			columns: { profileId: true }
		})
	]);
	return (!!current && current.id !== self) || (!!former && former.profileId !== self);
}

/**
 * Renames profile `id`; false when the name is taken. Everything is keyed by
 * the profile id, so recipes, friends, the Journal and saves follow. The old
 * name is kept as a former one (old links redirect, and it stays reserved);
 * taking back one's own former name drops that reservation.
 */
export async function changeUsername(
	id: string,
	username: string,
	conn: Tx | typeof db = db
): Promise<boolean> {
	if (await usernameTaken(username, id, conn)) return false;
	try {
		await conn.transaction(async (tx) => {
			const [row] = await tx
				.select({ username: profiles.username })
				.from(profiles)
				.where(eq(profiles.id, id))
				.for('update');
			if (!row || row.username === username) return;
			await tx
				.delete(formerUsernames)
				.where(and(eq(formerUsernames.username, username), eq(formerUsernames.profileId, id)));
			await tx.insert(formerUsernames).values({ username: row.username, profileId: id });
			await tx.update(profiles).set({ username }).where(eq(profiles.id, id));
		});
	} catch (e) {
		// Someone took it between the check and the write.
		if (uniqueViolation(e)) return false;
		throw e;
	}
	return true;
}

const uniqueViolation = (e: unknown): boolean => {
	const pgError = e instanceof Error && e.cause ? e.cause : e;
	return (pgError as { code?: string } | null)?.code === '23505';
};

/**
 * The profile a username in a URL or an @handle points at, as a where clause:
 * the profile with that name now, or the one that gave it up. A caller that
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
				.where(eq(formerUsernames.username, username))
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
