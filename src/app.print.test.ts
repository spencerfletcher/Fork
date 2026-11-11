import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { cssRule } from '#lib/testing/css.js';

// The recipe page's paper copy (DESIGN.md, Print). jsdom cannot print, so the
// rules are read from app.css's one print block; e2e/print.test.ts renders them.

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');
const start = css.indexOf('@media print {');
const print = css.slice(start);
const rule = (selector: string) => cssRule(print, selector);

describe('the print stylesheet', () => {
	test('is one block, the last in app.css, so it wins over every screen rule', () => {
		expect(start).toBeGreaterThan(0);
		expect(css.indexOf('@media print', start + 1)).toBe(-1);
		expect(print.trimEnd().endsWith('}')).toBe(true);
	});

	test.each([
		'.nav-shell',
		'.tab-bar',
		'.skip-link',
		'.hero',
		'.cook-header',
		'.bar-row',
		'.section-tabs',
		'.finish',
		'.clear-ticks',
		'#recipe .serves',
		'#recipe .tick',
		'#recipe .form-hint a'
	])('hides %s', (selector) => {
		expect(rule(selector)).toMatch(/display:\s*none\s*!important/);
	});

	test('shows the print header the screen hides', () => {
		expect(rule('.print-header')).toMatch(/display:\s*block\s*!important/);
	});

	test('black on white, no backgrounds', () => {
		const all = rule('*');
		expect(all).toMatch(/color:\s*#000\s*!important/);
		expect(all).toMatch(/background:\s*transparent\s*!important/);
		expect(rule('html')).toMatch(/background:\s*#fff/);
	});

	test('a body size of 11 to 12pt', () => {
		const size = Number(/font-size:\s*([\d.]+)pt/.exec(rule('html'))?.[1]);
		expect(size).toBeGreaterThanOrEqual(11);
		expect(size).toBeLessThanOrEqual(12);
	});

	test('both sections print, one column, whatever the phone tabs or cooking chose', () => {
		expect(rule('#recipe')).toMatch(/display:\s*block\s*!important/);
		expect(rule('#recipe aside')).toMatch(/display:\s*block\s*!important/);
		expect(rule('#recipe .main')).toMatch(/display:\s*block\s*!important/);
		// The section headings, visually hidden below 1024px on screen, print.
		expect(rule('#recipe h2')).toMatch(/position:\s*static\s*!important/);
		expect(rule('#recipe .sidebar-sticky')).toMatch(/max-height:\s*none\s*!important/);
	});

	test('a ticked row prints un-struck', () => {
		expect(rule('#recipe label')).toMatch(/text-decoration-line:\s*none\s*!important/);
	});

	test('a row or step never splits across pages, and a heading stays with what follows', () => {
		expect(rule('#recipe label')).toMatch(/break-inside:\s*avoid/);
		expect(rule('#recipe li')).toMatch(/break-inside:\s*avoid/);
		expect(rule('#recipe h3')).toMatch(/break-after:\s*avoid/);
		expect(rule('#recipe h2')).toMatch(/break-after:\s*avoid/);
	});

	test('links are not underlined and long words wrap', () => {
		expect(rule('a')).toMatch(/text-decoration:\s*none\s*!important/);
		expect(rule('#recipe')).toMatch(/overflow-wrap:\s*anywhere/);
	});

	test('the page has margins of its own', () => {
		expect(cssRule(css, '@page')).toMatch(/margin:/);
	});
});
