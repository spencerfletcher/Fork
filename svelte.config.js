import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
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
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				// Governs style="" attributes, which a nonce on style-src would
				// otherwise block — app.html wraps the app in one.
				'style-src-attr': ['unsafe-inline'],
				'font-src': ['self', 'https://fonts.gstatic.com', 'data:'],
				// Recipe images are user-supplied URLs as well as Supabase Storage.
				'img-src': ['self', 'data:', 'https:'],
				// No browser-side Supabase client; the only client fetch is
				// same-origin, to /api/convert-to-grams.
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
