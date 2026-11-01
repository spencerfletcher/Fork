// Runs one read-only SQL query against the hosted project and prints the rows.
//   pnpm db:read:prod "<sql>"
// Goes through the Management API's read-only endpoint, so it cannot write,
// and needs only a personal access token scoped to Database: Read
// (SUPABASE_ACCESS_TOKEN) plus SUPABASE_PROJECT_ID, both read from .env.
// `supabase db query --linked` won't do: it first sets up a login role, which
// needs database_write.
try {
	process.loadEnvFile('.env');
} catch {
	// No .env: the variables must already be in the environment.
}

const query = process.argv[2];
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_ID;
if (!query || !token || !ref) {
	console.error('Usage: pnpm db:read:prod "<sql>"');
	console.error('Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID in .env.');
	process.exit(1);
}

const response = await fetch(
	`https://api.supabase.com/v1/projects/${ref}/database/query/read-only`,
	{
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	}
);
const body: unknown = await response.json().catch(() => null);
if (!response.ok) {
	console.error(`${response.status}:`, body);
	process.exit(1);
}
if (Array.isArray(body) && body.length > 0) console.table(body);
else console.log('No rows.');
