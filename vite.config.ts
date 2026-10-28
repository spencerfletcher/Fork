// Pinned rather than adapter-auto, which resolves the host at build time and
// installs the adapter mid-build — a network call inside the deploy.
import adapter from '@sveltejs/adapter-netlify';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Netlify's deploy-preview toolbar embeds an iframe from app.netlify.com.
// Allow it on preview builds only; production keeps the strict policy.
const netlifyPreviewFrames =
	process.env.CONTEXT === 'deploy-preview' ? (['https://app.netlify.com'] as const) : [];

export default defineConfig({
	build: {
		rollupOptions: {
			// drizzle-orm re-exports `sql` at the package root; rollup incorrectly
			// flags every file that imports from drizzle-orm as "importing sql but
			// never using it". Suppress this known false-positive.
			onwarn(warning, defaultHandler) {
				if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter === 'drizzle-orm') return;
				defaultHandler(warning);
			}
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: [vitePreprocess()],
			adapter: adapter(),
			// CSP is configured here rather than as a raw header in hooks.server.ts,
			// because SvelteKit emits an inline bootstrap <script> on every page and
			// only it can add the matching nonce/hash.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					// 'unsafe-inline' is required for Svelte transitions, which build
					// inline <style> elements at runtime.
					'style-src': ['self', 'unsafe-inline'],
					// Governs style="" attributes, which a nonce on style-src would
					// otherwise block — app.html wraps the app in one.
					'style-src-attr': ['unsafe-inline'],
					'font-src': ['self', 'data:'],
					// Recipe images are user-supplied URLs as well as Supabase Storage.
					'img-src': ['self', 'data:', 'https:'],
					// No browser-side Supabase client; form posts are same-origin.
					'connect-src': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-src': ['self', ...netlifyPreviewFrames]
				}
			}
		})
	],
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					// West of UTC, so a date printed in local time differs from its UTC
					// day and the compare page's UTC-date test means the same everywhere.
					env: { TZ: 'America/Los_Angeles' },
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**', 'e2e/**'],
					setupFiles: ['./src/vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'e2e/**']
				}
			}
		]
	}
});
