const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

/**
 * Which database the seed is about to wipe, checked before any side effect.
 * Local: both the Postgres and the Supabase API hosts are local. Hosted: the
 * API URL names a project ref and the Postgres credentials carry the same
 * ref, either in the direct host (`db.<ref>.supabase.co`) or the pooler user
 * (`postgres.<ref>`). Anything else is a mix-up and throws.
 */
export function describeSeedTarget(
	prod: boolean,
	databaseUrl: string,
	supabaseUrl: string
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
	if (dbLocal || apiLocal) {
		throw new Error(
			`db:seed:prod targets a hosted project but DATABASE_URL is ${db.hostname} and PUBLIC_SUPABASE_URL is ${apiHost}`
		);
	}
	const ref = apiHost.split('.')[0];
	const dbRef = db.hostname.startsWith('db.')
		? db.hostname.split('.')[1]
		: db.username.split('.')[1];
	if (dbRef !== ref) {
		throw new Error(`DATABASE_URL is for project ${dbRef} but PUBLIC_SUPABASE_URL is for ${ref}`);
	}
	return `hosted project ${ref}`;
}
