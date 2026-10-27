// Applies pending migrations from ./drizzle to the chosen database.
//   pnpm db:migrate         local stack (.env.local)
//   pnpm db:migrate:prod    hosted project (.env), guarded by SUPABASE_PROJECT_ID
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { loadEnv, targetFromEnv } from '../src/lib/server/db/env';

const { DATABASE_URL, description } = loadEnv(targetFromEnv());
console.log(`Migrating ${description}...`);

const client = postgres(DATABASE_URL, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
await client.end();
console.log('✅ Migrations applied.');
