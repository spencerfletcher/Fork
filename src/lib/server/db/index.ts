import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dev } from '$app/env';
import * as schema from './schema';
import { DATABASE_URL, DB_POOL_MAX } from '$app/env/private';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

type Client = ReturnType<typeof postgres>;

// Dev and the unit tests keep one client on globalThis, so a hot reload that
// re-runs this module reuses the pool instead of opening another beside it
// (each orphaned pool held its connections until Postgres ran out).
const cache = globalThis as typeof globalThis & { forkDbClient?: Client };

function connect(): Client {
	// Idle connections close after 20s, so a quiet dev server holds none.
	const created = postgres(DATABASE_URL, {
		max: DB_POOL_MAX ?? (dev ? 5 : 10),
		idle_timeout: 20
	});
	// On shutdown, let running queries finish (up to 5s), then hand the
	// signal back so the process exits as it would have.
	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.once(signal, () => {
			void created.end({ timeout: 5 }).finally(() => process.kill(process.pid, signal));
		});
	}
	return created;
}

const client = (dev && cache.forkDbClient) || connect();
if (dev) cache.forkDbClient = client;

export const db = drizzle(client, { schema });

/** A transaction's handle, as `db.transaction` passes it. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Closes the pool; the database tests call it in afterAll so no connection outlives the run. */
export async function closeDb() {
	if (cache.forkDbClient === client) delete cache.forkDbClient;
	await client.end({ timeout: 5 });
}
