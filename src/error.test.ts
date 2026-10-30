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

	test("the bar matches the app's: 24px outside the 1200 cap, 52px tall below 768, 56 from it", () => {
		// Navbar.svelte: px-5 on the nav (--spacing-5, 1.5rem), max-w-[1200px]
		// inside, h-[52px] md:h-14.
		expect(html).toMatch(/\.bar\s*{[^}]*height:\s*52px[^}]*padding:\s*0 24px/);
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

	// Heights from the source: font size x line height + vertical padding + borders.
	function rule(selector: string): string {
		const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`(?<!,)\\n\\t\\t\\t${escaped}\\s*{([^}]*)}`).exec(html)![1];
	}
	function px(block: string, prop: string): string | undefined {
		return new RegExp(`(?:^|[^-])${prop}:\\s*([^;]+);`).exec(block)?.[1].trim();
	}

	test("both buttons are the app's 48.75px: 15px at 1.65, 11px padding, a 1px border", () => {
		// app.css .btn-primary/.btn-ghost: 0.9375rem, body line-height 1.65,
		// padding 11px 16px, a 1px border (transparent on the primary).
		const shared = rule('.btn-primary,\n\t\t\t.btn-ghost');
		expect(px(shared, 'font-size')).toBe('0.9375rem');
		const lineHeight = Number(px(shared, 'line-height'));
		for (const selector of ['.btn-primary', '.btn-ghost']) {
			const block = rule(selector);
			const padding = px(block, 'padding')!;
			const border = px(block, 'border')!;
			expect(padding).toBe('11px 16px');
			expect(border).toMatch(/^1px solid /);
			expect(15 * lineHeight + 2 * parseFloat(padding) + 2 * parseFloat(border)).toBe(48.75);
		}
	});

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

	test('the title balances its lines, so "Recipe not found" never leaves one word dangling', () => {
		expect(html).toMatch(/h1\s*{[^}]*text-wrap:\s*balance/);
	});
});
