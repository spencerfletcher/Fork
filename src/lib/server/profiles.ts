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
 */
export async function ensureProfile(user: User): Promise<void> {
	const existing = await db.query.profiles.findFirst({
		where: eq(profiles.id, user.id),
		columns: { id: true }
	});
	if (existing) return;

	const base = user.email?.split('@')[0] ?? user.id.slice(0, 8);
	const [inserted] = await db
		.insert(profiles)
		.values({ id: user.id, username: base })
		.onConflictDoNothing({ target: profiles.username })
		.returning({ id: profiles.id });
	if (inserted) return;

	await db
		.insert(profiles)
		.values({ id: user.id, username: `${base}-${randomSuffix().slice(0, 4)}` });
}
