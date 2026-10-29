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
	});

	test('tries again first, by reloading, and goes home as the ghost', () => {
		// The lede says "Try again in a moment", so that is the main action. The
		// link is to this same URL, so without JavaScript it still loads again.
		expect(html).toMatch(
			/<a href="" class="btn-primary" onclick="location\.reload\(\); return false">Try again<\/a>/
		);
		expect(html).toMatch(/<a href="\/" class="btn-ghost">Go home<\/a>/);
		expect(html.indexOf('Try again')).toBeLessThan(html.indexOf('Go home'));
	});

	test("titles the tab like the app's pages, the message then Fork", () => {
		expect(html).toMatch(/<title>%sveltekit\.error\.message% — Fork<\/title>/);
	});

	test('the wordmark is a real Bitter 600, not one the browser thickens', () => {
		expect(html).toMatch(/\.brand\s*{[^}]*font-weight:\s*600/);
		expect(html).toMatch(
			/@font-face\s*{\s*font-family:\s*'Bitter';\s*font-weight:\s*600;[^}]*bitter-latin-600-normal\.woff2/
		);
	});

	test("the bar matches the app's: 20px outside the 1200 cap, 52px tall below 768, 56 from it", () => {
		// Navbar.svelte: px-5 on the nav, max-w-[1200px] inside, h-[52px] md:h-14.
		expect(html).toMatch(/\.bar\s*{[^}]*height:\s*52px[^}]*padding:\s*0 20px/);
		expect(html).toMatch(/@media \(min-width: 768px\)\s*{\s*\.bar\s*{\s*height:\s*56px/);
		const inner = /\.inner\s*{([^}]*)}/.exec(html)![1];
		expect(inner).toMatch(/max-width:\s*1200px/);
		expect(html).not.toMatch(/\.inner\s*{[^}]*padding/);
	});

	test('sits centred on the screen like the login page', () => {
		expect(html).toMatch(/min-height:\s*calc\(100dvh - 56px\)/);
		expect(html).toMatch(/text-align:\s*center/);
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
