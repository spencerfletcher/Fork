import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// .env.local first and with override, mirroring src/lib/server/db/seed.ts.
//
// This is load-bearing, not tidiness. A built SvelteKit app resolves
// $env/dynamic/private from process.env at runtime rather than from .env files,
// and the preview server started below inherits this process's environment. So
// whatever DATABASE_URL this file puts on process.env is the database the suite
// writes to. Loading only .env pointed the whole suite at production, where the
// authenticated tests appended a recipe version on every single run.
loadEnv({ path: '.env.local', override: true, quiet: true });
loadEnv({ path: '.env', override: false, quiet: true });

// Belt and braces. The authenticated tests create recipes and commit versions,
// so refuse to run at all unless the target database is local. CI sets
// DATABASE_URL from `supabase status`, which is 127.0.0.1, so this passes there.
const dbHost = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : '';
if (dbHost && !['127.0.0.1', 'localhost', '::1'].includes(dbHost)) {
	throw new Error(
		`Refusing to run e2e against a non-local database (host: ${dbHost}). ` +
			'The authenticated tests write recipes and versions. Point DATABASE_URL at a ' +
			'local Supabase stack, or run `supabase start` and check .env.local.'
	);
}

const AUTH_FILE = path.join('e2e', '.auth', 'user.json');

export default defineConfig({
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		// Re-use an already-running preview server if present (faster local dev)
		reuseExistingServer: !process.env.CI
	},

	testDir: 'e2e',
	timeout: 10000,

	projects: [
		// ── 1. Auth setup — runs first, logs in and saves storage state ──────────
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/
		},

		// ── 2. Unauthenticated tests ─────────────────────────────────────────────
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			// Does NOT depend on setup — these tests run as a guest
			testIgnore: /authenticated\.test\.ts/
		},

		// ── 3. Authenticated tests ────────────────────────────────────────────────
		{
			name: 'chromium-auth',
			use: {
				...devices['Desktop Chrome'],
				storageState: AUTH_FILE
			},
			testMatch: /authenticated\.test\.ts/,
			dependencies: ['setup']
		}
	]
});
