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

	// Heights from the source: font size x line height + vertical padding + borders.
	function rule(selector: string): string {
		const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`(?<!,)\\n\\t\\t\\t${escaped}\\s*{([^}]*)}`).exec(html)![1];
	}
	function px(block: string, prop: string): string | undefined {
		return new RegExp(`(?:^|[^-])${prop}:\\s*([^;]+);`).exec(block)?.[1].trim();
	}

	test('the primary keeps its box under forced colours with a transparent border', () => {
		expect(px(rule('.btn-primary'), 'border')).toBe('1px solid transparent');
	});

	test("the wordmark link fits the phone bar's 52px", () => {
		// 1.375rem at the body's 1.5 line height, plus its vertical padding.
		const brand = rule('.brand');
		expect(px(brand, 'line-height')).toBeUndefined();
		expect(px(rule('body'), 'line-height')).toBe('1.5');
		const height = 22 * 1.5 + 2 * parseFloat(px(brand, 'padding')!);
		expect(height).toBeLessThanOrEqual(52);
		expect(height).toBeGreaterThanOrEqual(44);
	});
});
