import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Load .env so E2E_USER_EMAIL / E2E_USER_PASSWORD are available to the test runner
loadEnv();

const AUTH_FILE = path.join('e2e', '.auth', 'user.json');

export default defineConfig({
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		// Re-use an already-running preview server if present (faster local dev)
		reuseExistingServer: !process.env.CI,
	},

	testDir: 'e2e',

	projects: [
		// ── 1. Auth setup — runs first, logs in and saves storage state ──────────
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},

		// ── 2. Unauthenticated tests ─────────────────────────────────────────────
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			// Does NOT depend on setup — these tests run as a guest
			testIgnore: /authenticated\.test\.ts/,
		},

		// ── 3. Authenticated tests ────────────────────────────────────────────────
		{
			name: 'chromium-auth',
			use: {
				...devices['Desktop Chrome'],
				storageState: AUTH_FILE,
			},
			testMatch: /authenticated\.test\.ts/,
			dependencies: ['setup'],
		},
	],
});
