import { afterAll } from 'vitest';
import type { Tx } from '#lib/server/db/index.js';

try {
	process.loadEnvFile('.env.local');
} catch {
	// CI has no .env.local; it sets the variables itself.
}

/** Whether DATABASE_URL is the local Supabase stack, the only database a db test may write to. */
export const localDb = process.env.DATABASE_URL?.includes('127.0.0.1') ?? false;

const ROLLBACK = 'rollback';

/**
 * Runs `body` in a transaction that is always rolled back, so it leaves no row
 * behind. An error of the body's own, a refused insert included, propagates.
 * The db module is imported here, not at the top: it throws without
 * DATABASE_URL, and a skipped suite still loads its file.
 */
export async function inRollback(body: (tx: Tx) => Promise<void>): Promise<void> {
	const { db } = await import('#lib/server/db/index.js');
	const error = await db
		.transaction(async (tx) => {
			await body(tx);
			throw new Error(ROLLBACK);
		})
		.catch((e: unknown) => e);
	if (!(error instanceof Error) || error.message !== ROLLBACK) throw error;
}

/** A suffix unique to this run, for slugs and names that must not meet another file's. */
export const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Closes the pool once the file is done, so no connection outlives the run. Call it at the file's top level. */
export function closeDbAfter() {
	afterAll(async () => {
		if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
	});
}

/**
 * Runs `body` with `n` fresh profiles inside `inRollback`: ids `test-a-<stamp>`,
 * `test-b-<stamp>`… named `a-<stamp>`, `b-<stamp>`…, and the stamp they share.
 */
export async function withProfiles(
	n: number,
	body: (tx: Tx, ids: string[], stamp: string) => Promise<void>
): Promise<void> {
	const { profiles } = await import('#lib/server/db/schema.js');
	const s = stamp();
	const letters = 'abcdefghijklmnopqrstuvwxyz'.slice(0, n).split('');
	const ids = letters.map((l) => `test-${l}-${s}`);
	await inRollback(async (tx) => {
		await tx
			.insert(profiles)
			.values(letters.map((l, i) => ({ id: ids[i], username: `${l}-${s}` })));
		await body(tx, ids, s);
	});
}
