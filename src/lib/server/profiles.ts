import type { User } from '@supabase/supabase-js';
import { db } from './db/index.js';
import { profiles } from './db/schema.js';

/** Guarantees a profile row for an authenticated user before they write anything. */
export async function ensureProfile(user: User): Promise<void> {
	await db
		.insert(profiles)
		.values({ id: user.id, username: user.email?.split('@')[0] ?? user.id })
		.onConflictDoNothing();
}
