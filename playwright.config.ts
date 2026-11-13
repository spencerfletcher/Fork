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

/** Specs that change the seed user's settings, saves or Journal; see the chromium-account project. */
const ACCOUNT_SPECS = /(settings|measurement|keep-version|journal-recall)\.authenticated\.test\.ts/;

const PORT = Number(process.env.E2E_PORT) || 4174;

export default defineConfig({
	globalSetup: './e2e/global-setup.ts',

	webServer: {
		// Its own port, never reused: a preview already running on 4173 serves
		// the dev database. E2E_PORT moves it when something else holds 4174.
		command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: false
	},

	testDir: 'e2e',
	// Every test, not just every file, gets its own worker slot: the recipe
	// file alone is 86 tests, which one worker ran back to back while the rest
	// sat idle. Tests that act right after loading wait for hydration
	// (e2e/helpers.ts gotoHydrated), since a loaded machine hydrates late.
	fullyParallel: true,
	timeout: 10000,
	// A broad break (sign-in down, a layout crash) would otherwise wait out
	// every test's timeout; ten failures are enough to see what broke.
	maxFailures: 10,
	// Default is half the cores locally and one in CI. Each authenticated test
	// creates and deletes its own recipe, so they do not collide when parallel.
	// Eight locally: on a quiet machine the full run (241 passed) took ~59-61s
	// at 8, ~70s at 6 and ~105s at 4, three of three green at 6 and 8. A
	// failure that shows only at higher counts is a race in the test: fix it
	// there, not with a lower count.
	workers: process.env.CI ? 2 : 8,

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
			testIgnore: ACCOUNT_SPECS,
			dependencies: ['setup']
		},

		// ── 4. Tests that change the seed user's own settings ─────────────────────
		// A rename, a default audience or a measurement preference shows on every
		// page the other signed-in tests read, and new Journal entries change the
		// Journal's lists and counts, so these run once those are done.
		// Running one of them alone still runs those first: every run reseeds the
		// database, so the sign-in from an earlier run is no longer valid.
		{
			name: 'chromium-account',
			use: {
				...devices['Desktop Chrome'],
				storageState: AUTH_FILE
			},
			testMatch: ACCOUNT_SPECS,
			dependencies: ['chromium-auth']
		}
	]
});
