import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

// The design system's tokens live in app.css as plain CSS variables. This
// test pins the locked values and proves every text/background pair the app
// draws clears WCAG AA, so a palette edit cannot silently drop below 4.5:1.

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

	test('exact values the design locked', () => {
		expect(tokens['--color-bg']).toBe('#f7f3ec');
		expect(tokens['--color-accent']).toBe('#b23c00');
		expect(tokens['--color-marigold']).toBe('#eca620');
		expect(tokens['--color-remove']).toBe('#a3362b');
	});

	test('no dark theme block', () => {
		expect(css).not.toContain("[data-theme='dark']");
	});

	test('fonts are the locked families', () => {
		expect(tokens['--font-serif']).toMatch(/^'bitter'/);
		expect(tokens['--font-sans']).toMatch(/^'source sans 3'/);
		expect(tokens['--font-mono']).toMatch(/^'jetbrains mono'/);
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
				return src.includes('hero-bg') && /\baccent\b|accent-mid|accent-pale/.test(src);
			});
		expect(offenders).toEqual([]);
	});

	test('page titles take the clay accent everywhere', () => {
		const h1 = css.match(/\n\th1 \{([^}]*)\}/)?.[1] ?? '';
		expect(h1).toContain('color: var(--color-accent)');
	});
});

describe('app.css invalid fields', () => {
	// A fill made an empty invalid box look filled; the red border and text say
	// it, on every form.
	const rule = css.slice(
		css.indexOf(".form :is(input, textarea):is(:user-invalid, [aria-invalid='true']) {")
	);
	const block = rule.slice(0, rule.indexOf('}'));

	test('an invalid field keeps the red border and text', () => {
		expect(block).toMatch(/border-color:\s*var\(--color-remove\)/);
		expect(block).toMatch(/[^-]color:\s*var\(--color-remove\)/);
	});

	test('an invalid field takes no error fill', () => {
		expect(block).not.toMatch(/background/);
	});
});

describe('app.css buttons', () => {
	const weight = (selector: string) =>
		new RegExp(`\\n\\t\\${selector} \\{[^}]*font-weight:\\s*(\\d+)`).exec(css)?.[1];

	// Favorite sits beside Fork and Edit in one row; a lighter ghost reads as
	// the lesser control's text, not a peer.
	test('the ghost button carries the primary button weight', () => {
		expect(weight('.btn-primary')).toBe('600');
		expect(weight('.btn-ghost')).toBe(weight('.btn-primary'));
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

describe('app.css tag tabs', () => {
	const rule = (selector: string) => {
		const start = css.indexOf(`\n\t${selector}`);
		return start === -1 ? '' : css.slice(start, css.indexOf('}', start));
	};

	// Search and Favorites press the same tab the browse pages mark current:
	// one rule, ink 600 over the clay underline, no pill.
	test('a pressed filter wears the current tab underline', () => {
		const current = rule(".tag-tabs a[aria-current='page'],");
		expect(current).toContain(".tag-tabs button[aria-pressed='true']");
		expect(current).toMatch(/border-bottom-color:\s*var\(--color-accent\)/);
		expect(current).toMatch(/font-weight:\s*600/);
		expect(css).not.toContain("button[aria-pressed='true']::before");
	});
});
