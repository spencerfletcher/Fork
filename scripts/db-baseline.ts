// Marks the first migration in ./drizzle as already applied, for a database
// whose schema already matches it (hosted, built by the retired Supabase
// chain). Run once per such database; later migrations then apply normally
// with db:migrate. Refuses when the Drizzle journal table already has rows.
//   pnpm db:baseline         local stack
//   pnpm db:baseline:prod    hosted project, guarded by SUPABASE_PROJECT_ID
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { loadEnv, targetFromEnv } from '../src/lib/server/db/env';

const { DATABASE_URL, description } = loadEnv(targetFromEnv());

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as {
	entries: { tag: string; when: number }[];
};
const [baseline] = journal.entries;
// Drizzle's migrator records the sha256 of the migration file and the journal
// timestamp; it applies only entries newer than the newest recorded timestamp.
const hash = createHash('sha256')
	.update(readFileSync(`drizzle/${baseline.tag}.sql`, 'utf8'))
	.digest('hex');

const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
	id serial PRIMARY KEY,
	hash text NOT NULL,
	created_at bigint
)`;
const [{ count }] = await sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
if (count > 0) {
	console.error(`${description} already has ${count} recorded migration(s); nothing to baseline.`);
	await sql.end();
	process.exit(1);
}
await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${baseline.when})`;
await sql.end();
console.log(`✅ Marked ${baseline.tag} as applied on ${description}.`);
