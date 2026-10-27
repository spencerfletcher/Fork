import type { User } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { profiles } from './db/schema.js';
import { randomSuffix } from '#lib/helpers.js';

/**
 * Guarantees a profile row for an authenticated user before they write
 * anything. The username defaults to the email's local part; when another
 * account already took it, a short random suffix is added rather than
 * silently leaving the user without a profile (which would fail every later
 * recipe insert on its foreign key).
 *
 * Safe to call twice at once: a conflict on the id means the other call won,
 * which is success; only a conflict on the username earns a retry.
 */
export async function ensureProfile(user: User): Promise<void> {
	const base = user.email?.split('@')[0] ?? user.id.slice(0, 8);
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

async function hasProfile(id: string): Promise<boolean> {
	const row = await db.query.profiles.findFirst({
		where: eq(profiles.id, id),
		columns: { id: true }
	});
	return row !== undefined;
}
