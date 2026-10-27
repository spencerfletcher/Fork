// Runs one SQL file against the chosen database, several statements allowed.
//   pnpm db:sql <file>          local stack
//   pnpm db:sql:prod <file>     hosted project, guarded by SUPABASE_PROJECT_ID
// For one-off data fixes and for replaying a retired migration by hand; a
// schema change still belongs in a generated migration.
import postgres from 'postgres';
import { loadEnv, targetFromEnv } from '../src/lib/server/db/env';

const file = process.argv[2];
if (!file) {
	console.error('Usage: pnpm db:sql <path-to-sql-file>');
	process.exit(1);
}

const { DATABASE_URL, description } = loadEnv(targetFromEnv());
console.log(`Running ${file} against ${description}...`);

// No parameters, so postgres.js uses the simple query protocol, which accepts
// a file with many statements.
const sql = postgres(DATABASE_URL, { max: 1 });
await sql.file(file);
await sql.end();
console.log('✅ Done.');
