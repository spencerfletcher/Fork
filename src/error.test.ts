import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// SvelteKit renders src/error.html when an error happens outside the app's own
// error page (a crashed root layout, a failed render), with no app CSS or
// fonts around it. So the file carries Fork's look itself, from the shipped
// static fonts.
const html = readFileSync(join(__dirname, 'error.html'), 'utf8');

describe('fallback error page', () => {
	test('carries the status and the message SvelteKit fills in', () => {
		expect(html).toMatch(/<h1>Error %sveltekit\.status% – %sveltekit\.error\.message%<\/h1>/);
	});

	test('wears the Fork bar and leads home', () => {
		// No whitespace between the word and its stop, or the bar reads "Fork .".
		expect(html).toMatch(/class="brand">Fork<span>\.<\/span><\/a>/);
		expect(html).toMatch(/<a href="\/"[^>]*>Go home<\/a>/);
	});

	test('loads only fonts the site ships, by their asset path', () => {
		const fonts = [...html.matchAll(/%sveltekit\.assets%\/fonts\/([\w.-]+\.woff2)/g)].map(
			(m) => m[1]
		);
		expect(fonts.length).toBeGreaterThan(0);
		for (const font of fonts) {
			expect(existsSync(join(__dirname, '..', 'static', 'fonts', font))).toBe(true);
		}
		expect(html).not.toMatch(/fonts\.googleapis|app\.css/);
	});
});
