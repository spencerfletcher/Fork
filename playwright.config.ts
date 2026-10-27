import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { loadEnv } from './src/lib/server/db/env';

// A built SvelteKit app resolves $env/dynamic/private from process.env at
// runtime, and the preview server below inherits this process's environment,
// so whatever loadEnv puts there is the database the suite writes to. 'local'
// loads .env.local first and refuses a hosted DATABASE_URL outright: the
// authenticated tests create recipes and versions, and once ran against
// production by accident.
loadEnv('local');

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
			testMatch: /authenticated\.test\.ts/,
			dependencies: ['setup']
		}
	]
});
