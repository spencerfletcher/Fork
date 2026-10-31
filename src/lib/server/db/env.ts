// Env loading for Node tooling (seed, migrations, Drizzle Studio, Playwright).
// The app itself reads $env; this is for scripts that must choose a database
// on purpose. Extensionless import so Playwright's loader can follow it.
import { describeDbTarget, type DbTarget } from './target';

export type { DbTarget };

/**
 * `DB_TARGET=prod` selects the hosted project, `DB_TARGET=e2e` the suite's own
 * fork_e2e database on the local stack; anything else is the local stack.
 */
export function targetFromEnv(): DbTarget {
	const target = process.env.DB_TARGET;
	return target === 'prod' || target === 'e2e' ? target : 'local';
}

/**
 * Loads the env files for `target` and refuses a mix-up before returning.
 * Variables already in the environment win, and a file never overwrites a
 * variable an earlier file set. Local reads `.env.local`; e2e reads `.env.e2e`
 * (its database and users) and then `.env.local` (the stack's URL and keys), so
 * `.env.e2e` overrides; `.env` fills whatever is still unset. Prod skips both,
 * so `.env` (hosted) is the only file read.
 */
export function loadEnv(target: DbTarget) {
	if (target === 'e2e') loadFile('.env.e2e');
	if (target !== 'prod') loadFile('.env.local');
	loadFile('.env');

	const DATABASE_URL = required('DATABASE_URL');
	const SUPABASE_URL = required('PUBLIC_SUPABASE_URL');
	const description = describeDbTarget(
		target,
		DATABASE_URL,
		SUPABASE_URL,
		process.env.SUPABASE_PROJECT_ID
	);
	return {
		description,
		DATABASE_URL,
		SUPABASE_URL,
		SUPABASE_SECRET_KEY: required('SUPABASE_SECRET_KEY')
	};
}

/** A missing file is fine: CI sets every variable in the environment and has none. */
function loadFile(path: string) {
	try {
		process.loadEnvFile(path);
	} catch {
		// absent file
	}
}

function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}
