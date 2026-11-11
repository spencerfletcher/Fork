import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cssRules } from '#lib/testing/css.js';

// SvelteKit renders src/error.html when an error happens outside the app's own
// error page (a crashed root layout, a failed render), with no app CSS or
// fonts around it. So the file carries Fork's look itself, from the shipped
// static fonts.
const html = readFileSync(join(__dirname, 'error.html'), 'utf8');

describe('fallback error page', () => {
	test('carries the status and the message SvelteKit fills in', () => {
		expect(html).toMatch(/<h1>Error %sveltekit\.status% – %sveltekit\.error\.message%<\/h1>/);
	});

	test('wears the Fork bar and leads home by the F. mark', () => {
		const brand = /<a href="\/" class="brand" aria-label="Fork">([\s\S]*?)<\/a>/.exec(html)![1];
		expect(brand).toMatch(/<svg viewBox="32\.59 26\.88 37\.5 46\.01" aria-hidden="true">/);
		expect(brand.match(/<path\b/g)).toHaveLength(2);
		expect(brand).not.toMatch(/<text|Fork/);
	});

	// error.html cannot import Navbar, so it draws the mark again: a redraw in one
	// file must show here.
	test("draws the navbar's F. mark, its dot app.css's marigold", () => {
		const navbar = readFileSync(join(__dirname, 'lib/components/ui/Navbar.svelte'), 'utf8');
		const appCss = readFileSync(join(__dirname, 'app.css'), 'utf8');
		const paths = (source: string) =>
			[...source.matchAll(/<path\s+fill="([^"]+)"\s+d="([^"]+)"/g)].map((m) => ({
				fill: m[1],
				d: m[2]
			}));
		const ours = paths(html);
		const bar = paths(navbar);
		expect(ours).toHaveLength(2);
		expect(ours.map((p) => p.d)).toEqual(bar.map((p) => p.d));
		expect(bar[1].fill).toBe('var(--color-marigold)');
		const marigold = /--color-marigold:\s*(#[0-9a-f]{3,8});/i.exec(appCss)![1];
		expect(ours[1].fill.toLowerCase()).toBe(marigold.toLowerCase());
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
	// Every rule naming the selector, a list (`.btn-primary, .btn-ghost`) included.
	const rule = (selector: string) => cssRules(html, selector).join('\n');
	function px(block: string, prop: string): string | undefined {
		return new RegExp(`(?:^|[^-])${prop}:\\s*([^;]+);`).exec(block)?.[1].trim();
	}

	test('the primary keeps its box under forced colours with a transparent border', () => {
		expect(px(rule('.btn-primary'), 'border')).toBe('1px solid transparent');
	});

	test("the mark's link is a 44px target, its F the app bar's 15.7px", () => {
		const brand = rule('.brand');
		expect(px(brand, 'min-height')).toBe('44px');
		expect(px(brand, 'align-items')).toBe('center');
		expect(px(rule('.brand svg'), 'height')).toBe('15.7px');
	});
});
