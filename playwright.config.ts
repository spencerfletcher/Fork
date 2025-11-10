import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	workers: process.env.CI ? 1 : 8,
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: process.env.CI ? false : true,
		timeout: 120000
	},
	use: {
		baseURL: 'http://localhost:4173'
	},
	timeout: 30 * 1000,
	expect: {
		timeout: 5000
	}
});
