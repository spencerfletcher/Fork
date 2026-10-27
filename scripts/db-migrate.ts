// Applies pending migrations from ./drizzle to the chosen database.
//   pnpm db:migrate         local stack (.env.local)
//   pnpm db:migrate:prod    hosted project (.env), guarded by SUPABASE_PROJECT_ID
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { loadEnv, targetFromEnv } from '../src/lib/server/db/env';

const { DATABASE_URL, description } = loadEnv(targetFromEnv());
console.log(`Migrating ${description}...`);

// Drizzle's own "create if not exists" statements raise NOTICEs on every run;
// they are not news, so they are not printed.
const client = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
const applied = async () =>
	Number((await client`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`)[0].n);

const before = await applied().catch(() => 0);
await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
const after = await applied();
await client.end();

const n = after - before;
console.log(n === 0 ? '✅ Already up to date.' : `✅ Applied ${n} migration${n === 1 ? '' : 's'}.`);
