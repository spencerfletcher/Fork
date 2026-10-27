// Env loading for Node tooling (seed, migrations, Drizzle Studio, Playwright).
// The app itself reads $env; this is for scripts that must choose a database
// on purpose. Extensionless import so Playwright's loader can follow it.
import { config } from 'dotenv';
import { describeDbTarget } from './target';

export type DbTarget = 'local' | 'prod';

/** `DB_TARGET=prod` selects the hosted project; anything else is the local stack. */
export function targetFromEnv(): DbTarget {
	return process.env.DB_TARGET === 'prod' ? 'prod' : 'local';
}

/**
 * Loads the env files for `target` and refuses a mix-up before returning.
 * Local: `.env.local` wins, even over shell variables, then `.env` fills gaps.
 * Prod: `.env.local` is skipped entirely, so `.env` (hosted) is the only source.
 */
export function loadEnv(target: DbTarget) {
	if (target === 'local') config({ path: '.env.local', override: true, quiet: true });
	config({ path: '.env', override: false, quiet: true });

	const DATABASE_URL = required('DATABASE_URL');
	const SUPABASE_URL = required('PUBLIC_SUPABASE_URL');
	const description = describeDbTarget(
		target === 'prod',
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

function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}
