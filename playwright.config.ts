import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { loadEnv } from './src/lib/server/db/env';

// A built SvelteKit app resolves $env/dynamic/private from process.env at
// runtime, and the preview server below inherits this process's environment,
// so whatever loadEnv puts there is the database the suite writes to. 'e2e'
// lays .env.e2e over .env.local and refuses any database but the local
// fork_e2e, which global-setup resets to the seed before every run; the dev
// database is never touched. Process env outranks .env.local in Vite's env
// loading, so the preview cannot fall back to the dev database.
loadEnv('e2e');

export const AUTH_FILE = path.join('e2e', '.auth', 'user.json');

export default defineConfig({
	globalSetup: './e2e/global-setup.ts',

	webServer: {
		// Its own port, never reused: a preview already running on 4173 serves
		// the dev database.
		command: 'pnpm build && pnpm preview --port 4174 --strictPort',
		port: 4174,
		reuseExistingServer: false
	},

	testDir: 'e2e',
	timeout: 10000,
	// Default is half the cores locally and one in CI. Each authenticated test
	// creates and deletes its own recipe, so they do not collide when parallel.
	workers: process.env.CI ? 2 : '80%',

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
			// invariants.test.ts runs here too, for its signed-in rows.
			testMatch: /(authenticated|invariants)\.test\.ts/,
			dependencies: ['setup']
		}
	]
});
