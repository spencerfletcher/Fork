export type DbTarget = 'local' | 'e2e' | 'prod';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];
const E2E_DATABASE = 'fork_e2e';

function projectRefOf(db: URL): string {
	// Direct host is db.<ref>.supabase.co; the pooler carries the ref in the user, postgres.<ref>.
	return db.hostname.startsWith('db.') ? db.hostname.split('.')[1] : db.username.split('.')[1];
}

/**
 * Which database a tool (seed, migrate, studio) is about to touch, checked
 * before any side effect. Local: both the Postgres and the Supabase API hosts
 * are local. E2E: local too, and the database is fork_e2e, which the suite
 * resets every run, so a stray DATABASE_URL can never reset the dev database.
 * Hosted: the expected project ref (SUPABASE_PROJECT_ID) is set,
 * and both the API URL and the Postgres credentials name that same ref.
 * Anything else throws.
 */
export function describeDbTarget(
	target: DbTarget,
	databaseUrl: string,
	supabaseUrl: string,
	expectedRef: string | undefined
): string {
	const db = new URL(databaseUrl);
	const apiHost = new URL(supabaseUrl).hostname;
	const dbLocal = LOCAL_HOSTS.includes(db.hostname);
	const apiLocal = LOCAL_HOSTS.includes(apiHost);

	if (target !== 'prod') {
		if (!dbLocal || !apiLocal) {
			throw new Error(
				`DB_TARGET=${target} targets the local stack but DATABASE_URL is ${db.hostname} and PUBLIC_SUPABASE_URL is ${apiHost}`
			);
		}
		if (target === 'local') return 'local database';
		const name = db.pathname.slice(1);
		if (name === E2E_DATABASE) return `e2e database ${E2E_DATABASE}`;
		throw new Error(`DB_TARGET=e2e must use the ${E2E_DATABASE} database, not ${name}`);
	}
	if (!expectedRef) {
		throw new Error('DB_TARGET=prod needs SUPABASE_PROJECT_ID set to the project it may change');
	}
	if (dbLocal || apiLocal) {
		throw new Error(
			`DB_TARGET=prod targets a hosted project but DATABASE_URL is ${db.hostname} and PUBLIC_SUPABASE_URL is ${apiHost}`
		);
	}
	const apiRef = apiHost.split('.')[0];
	const dbRef = projectRefOf(db);
	if (apiRef !== expectedRef || dbRef !== expectedRef) {
		throw new Error(
			`PUBLIC_SUPABASE_URL is for project ${apiRef} and DATABASE_URL for ${dbRef}, but SUPABASE_PROJECT_ID is ${expectedRef}`
		);
	}
	return `hosted project ${expectedRef}`;
}
