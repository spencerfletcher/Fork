import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

// The design system's tokens live in app.css as plain CSS variables. This
// test proves every text/background pair the app draws clears WCAG AA, so a
// palette edit cannot silently drop below 4.5:1.

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

const rootBlock = css
	.slice(css.indexOf(':root {'), css.indexOf('\n}\n', css.indexOf(':root {')))
	.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens: Record<string, string> = {};
for (const match of rootBlock.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
	tokens[match[1]] = match[2].trim().toLowerCase();
}

function luminance(hex: string): number {
	const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
	const [a, b] = [luminance(fg), luminance(bg)];
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const pairs: [string, string, number][] = [
	['--color-text', '--color-bg', 4.5],
	['--color-text-2', '--color-bg', 4.5],
	['--color-text-3', '--color-bg', 4.5],
	['--color-text-3', '--color-surface', 4.5],
	['--color-accent', '--color-bg', 4.5],
	['--color-accent', '--color-tint', 4.5],
	['--color-add', '--color-add-bg', 4.5],
	['--color-remove', '--color-remove-bg', 4.5],
	['--color-text', '--color-marigold', 4.5],
	['--color-text', '--color-marigold-hover', 4.5],
	['--color-text', '--color-band', 4.5],
	['--color-text-tan', '--color-navbar-bg', 4.5],
	['--color-text-cream', '--color-navbar-bg', 4.5],
	['--color-marigold', '--color-navbar-bg', 3]
];

describe('app.css tokens', () => {
	test.each(pairs)('%s on %s clears %s:1', (fg, bg, min) => {
		expect(tokens[fg]).toMatch(/^#[0-9a-f]{6}$/);
		expect(tokens[bg]).toMatch(/^#[0-9a-f]{6}$/);
		expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
	});

	// Clay is a text accent for paper. On the espresso surface it is 3.3:1 as
	// text and, with espresso text on it, 1:1 on hover. Components that paint
	// the espresso surface must use marigold for anything accented.
	test('no component draws the clay accent on the espresso surface', () => {
		const offenders = readdirSync(new URL('.', import.meta.url), { recursive: true })
			.map(String)
			.filter((f) => f.endsWith('.svelte'))
			.filter((f) => {
				const src = readFileSync(new URL(f, import.meta.url), 'utf8');
				return src.includes('navbar-bg') && /\baccent\b/.test(src);
			});
		expect(offenders).toEqual([]);
	});
});

// Hovers must be seen (decided 9 November 2026): the primary darkens clearly,
// the ghost takes the band.
describe('app.css hovers', () => {
	const body = (selector: string) =>
		css.match(new RegExp(`\\n\\s*${selector}\\s*\\{([^}]*)\\}`))![1];

	test('the primary hover is a clearly darker marigold', () => {
		expect(body('\\.btn-primary:hover')).toMatch(/background:\s*var\(--color-marigold-hover\)/);
		const step = contrast(tokens['--color-marigold'], tokens['--color-marigold-hover']);
		expect(step).toBeGreaterThanOrEqual(1.3);
	});

	test('the ghost hover fills with the band', () => {
		expect(body('\\.btn-ghost:hover')).toMatch(/background:\s*var\(--color-band\)/);
	});
});

// The shared utilities that replaced per-component copies (9 November 2026).
describe('app.css shared utilities', () => {
	const body = (selector: string) =>
		css.match(new RegExp(`\\n\\s*${selector}\\s*\\{([^}]*)\\}`))![1];
	const phone = css.slice(css.indexOf('@media (max-width: 699px), (pointer: coarse)'));

	test('a text button is clay at 24px, a thumb on a phone, and its hover goes ink and underlined', () => {
		expect(body('\\.text-btn')).toMatch(/color:\s*var\(--color-accent\)/);
		expect(body('\\.text-btn')).toMatch(/min-height:\s*24px/);
		expect(phone).toMatch(/\.text-btn \{\s*min-height: 44px/);
		expect(body('\\.text-btn:hover')).toMatch(/color:\s*var\(--color-text\)/);
		expect(body('\\.text-btn:hover')).toMatch(/text-decoration:\s*underline/);
		expect(body('\\.text-btn--ink:hover')).toMatch(/color:\s*var\(--color-accent\)/);
	});

	test('the dot is drawn, silent to a screen reader', () => {
		expect(body('\\.dot-list > \\* \\+ \\*::before')).toContain("content: '·' / ''");
	});

	test('an inline link is a 24px hit at desktop and 44px on a phone, without moving', () => {
		expect(body('\\.hit-link')).toMatch(/padding-block:\s*4px;\s*margin-block:\s*-4px/);
		expect(css).toMatch(
			/\.hit-link \{\s*display: inline-block;\s*padding-block: 11px;\s*margin-block: -11px/
		);
	});

	test('danger is a red ghost that keeps its red over the hover band', () => {
		expect(body('\\.btn-ghost\\.danger')).toMatch(/color:\s*var\(--color-remove\)/);
		expect(css.indexOf('.btn-ghost.danger {')).toBeGreaterThan(css.indexOf('.btn-ghost:hover {'));
	});
});

describe('app.css forced colours', () => {
	// Every tag tab carries a transparent 2px underline, which forced colours
	// would paint, marking every tab current. Canvas hides it again, so only
	// the current tab keeps its line.
	test('only the current tag tab keeps its underline', () => {
		const blocks = css.split('@media (forced-colors: active)').slice(1);
		const tabs = blocks.find((b) => b.includes('.tag-tabs'));
		expect(tabs).toBeDefined();
		const rule = tabs!.slice(0, tabs!.indexOf('}'));
		expect(rule).toContain(".tag-tabs a:not([aria-current='page'])");
		// A pressed filter is current too, so it keeps its line.
		expect(rule).toContain(".tag-tabs button:not([aria-pressed='true'])");
		expect(rule).toMatch(/border-bottom-color:\s*Canvas/);
	});
});

// A long unbroken word (a URL, a run of letters) must not widen the page on a
// phone: the title breaks anywhere, and grid tracks may shrink below their content.
describe('app.css long words', () => {
	/** The bodies of every rule whose selector is exactly `selector`. */
	const rules = (selector: string) =>
		[...css.matchAll(/^\s*([^{}\n]+?)\s*\{([^{}]*)\}/gm)]
			.filter((m) => m[1] === selector)
			.map((m) => m[2]);

	test('the base h1 breaks a long word anywhere', () => {
		expect(rules('h1').some((body) => /overflow-wrap:\s*anywhere/.test(body))).toBe(true);
	});

	test('the card grid tracks can shrink below a long title at every breakpoint', () => {
		const columns = rules('.recipe-grid')
			.map((body) => body.match(/grid-template-columns:\s*([^;]+);/)?.[1])
			.filter(Boolean);
		expect(columns).toHaveLength(3);
		for (const value of columns) expect(value).toMatch(/^repeat\(\d, minmax\(0, 1fr\)\)$/);
	});
});
