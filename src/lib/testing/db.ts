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
