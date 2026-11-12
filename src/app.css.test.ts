import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { cssRule, cssRules } from '#lib/testing/css.js';

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
	['--color-accent-hover', '--color-bg', 4.5],
	['--color-accent-hover', '--color-surface', 4.5],
	['--color-add', '--color-add-bg', 4.5],
	['--color-remove', '--color-remove-bg', 4.5],
	['--color-text', '--color-marigold', 4.5],
	['--color-text', '--color-marigold-hover', 4.5],
	['--color-text', '--color-band', 4.5],
	// The menu panel's edge (a UI boundary, 3:1), on paper and over the band.
	['--color-text-2', '--color-bg', 3],
	['--color-text-2', '--color-band', 3],
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

/** A stylesheet's rules, comments dropped, :global() unwrapped. A pattern, not a parser. */
const rulesOf = (source: string) =>
	[...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
		selectors: m[1].split(',').map((s) => s.trim().replace(/:global\((.+?)\)/g, '$1')),
		body: m[2]
	}));

/** app.css and every component's <style>. */
const stylesheets = readdirSync(new URL('.', import.meta.url), { recursive: true })
	.map(String)
	.filter((f) => f.endsWith('.svelte') || f === 'app.css')
	.map((f) => {
		const source = readFileSync(new URL(f, import.meta.url), 'utf8');
		return { f, style: f === 'app.css' ? source : (source.split('<style>')[1] ?? '') };
	});

// Hovers must be seen (decided 9 November 2026): the primary darkens clearly,
// the ghost takes the band.
describe('app.css hovers', () => {
	const body = (selector: string) => cssRule(css, selector);

	test('the primary hover is a clearly darker marigold', () => {
		expect(body('.btn-primary:hover')).toMatch(/background:\s*var\(--color-marigold-hover\)/);
		const step = contrast(tokens['--color-marigold'], tokens['--color-marigold-hover']);
		expect(step).toBeGreaterThanOrEqual(1.3);
	});

	test('the ghost hover fills with the band', () => {
		expect(body('.btn-ghost:hover')).toMatch(/background:\s*var\(--color-band\)/);
	});

	// Opacity 0.6, as the editor's tools and a disabled choice box (Add to
	// collection with nothing selected read as live).
	test('a disabled ghost or text button dims and takes no hover', () => {
		const rule = body('.btn-ghost:disabled, .text-btn:disabled');
		expect(rule).toMatch(/opacity:\s*0\.6/);
		expect(rule).toMatch(/pointer-events:\s*none/);
	});

	// The footer sits under a screen-tall auth page; its height comes off, or the page scrolls.
	test('a screen-tall auth page leaves the footer its height', () => {
		for (const rule of cssRules(css, '.auth-page').filter((r) => /min-height/.test(r)))
			expect(rule).toMatch(/var\(--footer-height\)/);
		expect(cssRules(css, 'body:has(.tab-bar) .auth-page').join()).toMatch(/var\(--footer-height\)/);
	});

	// The ⋯ is a box like the ghost and the menu rows (Spencer, 11 November 2026: "… to band").
	test('the ⋯ trigger fills with the band while hovered or open', () => {
		const rule = body(".more-button:hover, .more-button[aria-expanded='true']");
		expect(rule).toMatch(/background:\s*var\(--color-band\)/);
	});

	// The Hover Rule (DESIGN.md): clay text deepens, never turns ink.
	test('a clay link deepens to clay deep on hover, a clearly darker step', () => {
		expect(body('a:hover')).toMatch(/color:\s*var\(--color-accent-hover\)/);
		const step = contrast(tokens['--color-accent'], tokens['--color-accent-hover']);
		expect(step).toBeGreaterThanOrEqual(1.75);
	});

	// The same rule in every stylesheet: no hover turns clay-resting text ink.
	// Clay at rest is a selector given `color: var(--color-accent)` in the same
	// file or app.css, or a bare link (`a`, `a.x`) no rule recolours. A heuristic
	// over selectors, not a cascade: it catches the direct case.
	test('no hover turns clay text ink', () => {
		const coloured = (rules: ReturnType<typeof rulesOf>, value: RegExp) =>
			new Set(rules.filter((r) => value.test(r.body)).flatMap((r) => r.selectors));
		const global = rulesOf(css);
		const offenders = stylesheets.flatMap(({ f, style }) => {
			const rules = [...rulesOf(style), ...global];
			const clay = coloured(rules, /(^|[\s;])color:\s*var\(--color-accent\)/);
			const recoloured = coloured(rules, /(^|[\s;])color:/);
			return rulesOf(style)
				.filter((r) => /(^|[\s;])color:\s*var\(--color-text(-[23])?\)/.test(r.body))
				.flatMap((r) => r.selectors.filter((s) => s.endsWith(':hover')))
				.filter((s) => {
					const base = s.slice(0, -':hover'.length);
					const bareLink = /(^|\s)a([.[][^\s]*)?$/.test(base) && !recoloured.has(base);
					return clay.has(base) || bareLink;
				})
				.map((s) => `${f}: ${s}`);
		});
		expect(offenders).toEqual([]);
	});
});

// The hover rule (Spencer, 11 November 2026): words that act underline on
// hover with one shared underline, titles turn clay with none, boxes fill
// with the band, and an action inside a sentence is underlined at rest.
describe('the hover rule', () => {
	const UNDERLINE = /text-decoration-line:\s*underline/;
	const all = stylesheets.flatMap(({ f, style }) => rulesOf(style).map((r) => ({ f, ...r })));
	const hovers = all.filter((r) => r.selectors.some((s) => s.includes(':hover')));

	// The one definition: every underlined word takes its weight and offset here.
	const shared = rulesOf(css).filter((r) => /text-underline-offset/.test(r.body));
	const underlined = shared.flatMap((r) => r.selectors);

	test('one underline, 1px and 3px below the words, defined once', () => {
		expect(shared).toHaveLength(1);
		expect(shared[0].body).toMatch(/text-decoration-thickness:\s*1px/);
		expect(shared[0].body).toMatch(/text-underline-offset:\s*3px/);
		// No hover draws its own: it only switches the line on.
		const own = hovers.filter((r) =>
			/text-underline-offset|text-decoration-thickness/.test(r.body)
		);
		expect(own.map((r) => `${r.f}: ${r.selectors.join(', ')}`)).toEqual([]);
	});

	test('text buttons, arrow links, the back link and handles underline on hover', () => {
		const body = (selector: string) => cssRule(css, selector);
		for (const control of ['.text-btn', '.arrow-link', '.clear-ticks']) {
			expect(body(`${control}:hover`)).toMatch(UNDERLINE);
			expect(underlined).toContain(control);
		}
		// The ink text button is a .text-btn too, so it shares the definition.
		expect(body('.text-btn--ink:hover')).toMatch(UNDERLINE);
		// Words whose colour is a name keep it and gain the line.
		expect(body('.back-link:hover')).toMatch(UNDERLINE);
		expect(body('.back-link:hover')).not.toMatch(/(^|[\s;])color:/);
		for (const word of ['.back-link', '.username', '.handle']) expect(underlined).toContain(word);
		// The version bar's word-links and toggle, and a history row's note (not its chip).
		for (const word of ['.version-bar a', '.versions-toggle', '.version-link .message']) {
			expect(underlined).toContain(word);
		}
	});

	// A colour change alone is not a hover on a word that acts.
	test('no text control hovers by colour alone', () => {
		const WORDS =
			/\.(text-btn|arrow-link|back-link|clear-ticks|username|handle|versions-toggle|version-link|version-bar a)\b/;
		const offenders = hovers
			.filter((r) => r.selectors.some((s) => s.includes(':hover') && WORDS.test(s)))
			// The navbar's handle on espresso steps tan to cream, outside the rule.
			.filter((r) => !r.selectors.every((s) => s.includes('.on-dark')))
			.filter((r) => !UNDERLINE.test(r.body))
			.map((r) => `${r.f}: ${r.selectors.join(', ')}`);
		expect(offenders).toEqual([]);
	});

	test('a title turns clay and is never underlined', () => {
		const titles = all.filter((r) => r.selectors.some((s) => /title/.test(s)));
		const lined = titles.filter((r) => /text-decoration(-line)?:\s*underline/.test(r.body));
		expect(lined.map((r) => `${r.f}: ${r.selectors.join(', ')}`)).toEqual([]);
	});

	// "Clear search" beside "No recipes match 'tikka'": underlined at rest, so
	// it reads as an action on touch, and deeper clay on hover.
	test('an action inside a sentence is underlined at rest and deepens on hover', () => {
		expect(cssRules(css, '.inline-action').some((b) => UNDERLINE.test(b))).toBe(true);
		expect(underlined).toContain('.inline-action');
		expect(cssRule(css, '.inline-action:hover')).toMatch(/color:\s*var\(--color-accent-hover\)/);
	});

	// A tap on iOS leaves :hover set until the next tap elsewhere.
	test('the word hovers apply only where a pointer hovers', () => {
		const hoverBlocks = css.split('@media (hover: hover)').slice(1).join('');
		for (const control of ['.text-btn', '.arrow-link', '.back-link', '.inline-action']) {
			expect(hoverBlocks).toContain(`${control}:hover`);
			expect(css.split('@media (hover: hover)')[0]).not.toContain(`${control}:hover`);
		}
	});
});

// The shared utilities that replaced per-component copies (9 November 2026).
describe('app.css shared utilities', () => {
	const body = (selector: string) => cssRule(css, selector);
	const phone = css.slice(css.indexOf('@media (max-width: 699px), (pointer: coarse)'));

	test('a text button is clay at 24px, a thumb on a phone, and its hover deepens', () => {
		expect(body('.text-btn')).toMatch(/color:\s*var\(--color-accent\)/);
		expect(body('.text-btn')).toMatch(/min-height:\s*24px/);
		expect(phone).toMatch(/\.text-btn \{\s*min-height: 44px/);
		expect(body('.text-btn:hover')).toMatch(/color:\s*var\(--color-accent-hover\)/);
		expect(body('.text-btn--ink:hover')).toMatch(/color:\s*var\(--color-accent\)/);
	});

	// A fixed box near the top edge tints iOS Safari's status bar at every scroll.
	test('no fixed box is parked above the page', () => {
		expect(css).not.toMatch(/body::before/);
	});

	test('the dot is drawn, silent to a screen reader', () => {
		expect(body('.dot-list > * + *::before')).toContain("content: '·' / ''");
	});

	test('an inline link is a 24px hit at desktop and 44px on a phone, without moving', () => {
		const [desktop, phone] = cssRules(css, '.hit-link');
		expect(desktop).toMatch(/--hit:\s*4px;/);
		expect(desktop).toMatch(
			/padding-block:\s*var\(--hit\);\s*margin-block:\s*calc\(-1 \* var\(--hit\)\)/
		);
		expect(phone).toMatch(/--hit:\s*11px;/);
		expect(phone).toMatch(/display:\s*inline-block/);
	});

	test('the switch, closing, empty-state and back links take the same hit', () => {
		for (const link of ['.auth-switch a', '.arrow-link', '.empty-state a', '.back-link']) {
			expect(cssRules(css, link).slice(0, 2)).toEqual(cssRules(css, '.hit-link'));
		}
		// The back link's own bottom margin is net of the padding, so it does not move.
		expect(cssRules(css, '.back-link')[2]).toMatch(
			/margin-bottom:\s*calc\(var\(--space-3\) - var\(--hit\)\)/
		);
	});

	test('danger is a red ghost that keeps its red over the hover band; danger-hover turns red on hover', () => {
		const at = css.indexOf('.btn-ghost.danger,');
		const rule = css.slice(at, css.indexOf('}', at));
		expect(rule).toContain('.btn-ghost.danger-hover:is(:hover, :focus-visible)');
		expect(rule).toMatch(/border-color:\s*var\(--color-remove\)/);
		expect(rule).toMatch(/color:\s*var\(--color-remove\)/);
		expect(at).toBeGreaterThan(css.indexOf('.btn-ghost:hover {'));
	});

	test('the version chip is one class: no component redraws its face', () => {
		expect(body('.vid')).toMatch(/font-family:\s*var\(--font-mono\)/);
		expect(body('.vid')).toMatch(/font-weight:\s*600/);
		expect(body('.vid')).toMatch(/color:\s*var\(--color-accent\)/);
		const offenders = readdirSync(new URL('.', import.meta.url), { recursive: true })
			.map(String)
			.filter((f) => f.endsWith('.svelte'))
			.filter((f) => {
				const style = readFileSync(new URL(f, import.meta.url), 'utf8').split('<style>')[1] ?? '';
				return /(^|\n)\s*\.vid\s*\{/.test(style);
			});
		expect(offenders).toEqual([]);
	});
});

describe('app.css phone tab bar', () => {
	test('focus scrolls clear of the fixed tab bar, by the room the page ends with', () => {
		const room = cssRule(css, 'body:has(.tab-bar) main').match(/padding-bottom:\s*([^;]+);/)![1];
		expect(cssRule(css, 'html:has(.tab-bar)')).toContain(`scroll-padding-bottom: ${room};`);
	});
});

describe('app.css forced colours', () => {
	// Every tag tab carries a transparent 2px underline, which forced colours
	// would paint, marking every tab current. Canvas hides it again, so only
	// the current tab keeps its line.
	test('only the current tag tab keeps its underline', () => {
		const blocks = css.split('@media (forced-colors: active)').slice(1);
		const tabs = blocks.find((b) => b.slice(0, b.indexOf('}')).includes('.tag-tabs'));
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

	test('the Cookbook grid is two across from the narrowest phone, four from 1100', () => {
		expect(rules('.cookbook-grid')[0]).toMatch(
			/grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/
		);
		const wide = css.slice(
			css.indexOf('@media (min-width: 1100px)', css.indexOf('.cookbook-grid {'))
		);
		expect(cssRule(wide, '.cookbook-grid')).toMatch(/repeat\(4, minmax\(0, 1fr\)\)/);
	});
});
