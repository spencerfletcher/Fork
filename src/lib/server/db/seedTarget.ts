const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

function projectRefOf(db: URL): string {
	// Direct host is db.<ref>.supabase.co; the pooler carries the ref in the user, postgres.<ref>.
	return db.hostname.startsWith('db.') ? db.hostname.split('.')[1] : db.username.split('.')[1];
}

/**
 * Which database the seed is about to wipe, checked before any side effect.
 * Local: both the Postgres and the Supabase API hosts are local. Hosted: the
 * expected project ref (SUPABASE_PROJECT_ID) is set, and both the API URL and
 * the Postgres credentials name that same ref. Anything else throws.
 */
export function describeSeedTarget(
	prod: boolean,
	databaseUrl: string,
	supabaseUrl: string,
	expectedRef: string | undefined
): string {
	const db = new URL(databaseUrl);
	const apiHost = new URL(supabaseUrl).hostname;
	const dbLocal = LOCAL_HOSTS.includes(db.hostname);
	const apiLocal = LOCAL_HOSTS.includes(apiHost);

	if (!prod) {
		if (dbLocal && apiLocal) return 'local database';
		throw new Error(
			`db:seed targets the local stack but DATABASE_URL is ${db.hostname} and PUBLIC_SUPABASE_URL is ${apiHost}`
		);
	}
	if (!expectedRef) {
		throw new Error('db:seed:prod needs SUPABASE_PROJECT_ID set to the project it may wipe');
	}
	if (dbLocal || apiLocal) {
		throw new Error(
			`db:seed:prod targets a hosted project but DATABASE_URL is ${db.hostname} and PUBLIC_SUPABASE_URL is ${apiHost}`
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
