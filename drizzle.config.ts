import { defineConfig } from 'drizzle-kit';
import { loadEnv, targetFromEnv } from './src/lib/server/db/env';

// Local stack by default; `DB_TARGET=prod` for the hosted project, which
// loadEnv refuses unless SUPABASE_PROJECT_ID names it. `drizzle-kit generate`
// only reads the schema; `migrate` goes through scripts/db-migrate.ts, which
// runs the same check. `drizzle-kit push` stays banned (see AGENTS.md).
const { DATABASE_URL } = loadEnv(targetFromEnv());

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url: DATABASE_URL },
	verbose: true,
	strict: true
});
