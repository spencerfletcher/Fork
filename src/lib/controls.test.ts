import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

// DESIGN.md, Buttons: every clickable control is one of a closed set. A new
// hand-styled button fails here until it takes a shared class or is added to
// STRUCTURAL below on purpose, with its reason.

const CLOSED_SET = ['btn-primary', 'btn-ghost', 'text-btn'] as const;

/** Buttons that are structure, not a button look: file (under src/), its class attribute, why. */
const STRUCTURAL = [
	['lib/components/recipes/GroupedTextEditor.svelte', 'tool', 'editor toolbar item'],
	['lib/components/ui/ConfirmStep.svelte', 'triggerClass', "caller's class, checked at the call"],
	['lib/components/ui/Navbar.svelte', 'nav-avatar-button', 'icon-only avatar trigger'],
	['lib/components/ui/Navbar.svelte', '', 'account menu row'],
	['routes/friends/MoreMenu.svelte', 'more-button', 'icon-only menu trigger'],
	['routes/friends/MoreMenu.svelte', '', 'menu row'],
	['routes/friends/MoreMenu.svelte', 'danger', 'menu row, red'],
	['routes/friends/MoreMenu.svelte', 'confirm', "a menu step's confirm row"],
	['routes/friends/MoreMenu.svelte', 'confirm danger', "a menu step's confirm row, red"],
	['lib/components/ui/TagInput.svelte', 'tag-remove', "a tag pill's remove glyph"],
	['lib/components/ui/TagTabs.svelte', '', 'tag filter tab'],
	['lib/components/ui/TagTabs.svelte', 'tag-tabs__clear', 'the tag tabs row’s Clear all tab'],
	['lib/components/ui/SearchFilters.svelte', 'friends-toggle', 'filter chip'],
	['routes/recipes/[slug]/+page.svelte', '', 'section tab bar item'],
	['routes/recipes/[slug]/components/RecipeIngredients.svelte', 'clear-ticks', 'tick-row reset'],
	['routes/recipes/[slug]/components/RecipeMethod.svelte', 'clear-ticks', 'tick-row reset'],
	[
		'routes/recipes/[slug]/components/VersionBar.svelte',
		'versions-toggle',
		'a word in the version line'
	]
] as const;

const src = new URL('..', import.meta.url);
const sources = readdirSync(src, { recursive: true })
	.map(String)
	.filter((f) => f.endsWith('.svelte'))
	.map((file) => ({
		file,
		text: readFileSync(new URL(file, src), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
	}));

// An opening tag: quoted values and {expressions} (one level of nested braces) may hold `>`.
const TAG = /<(button|a)\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*)>/g;
const CLASS = /\bclass=(?:"([^"]*)"|\{((?:[^{}]|\{[^{}]*\})*)\})/;

/** Every button, and every link wearing a btn- class, with its class attribute as written. */
const controls = sources.flatMap(({ file, text }) => [
	...[...text.matchAll(TAG)]
		.map((m) => ({
			file,
			tag: m[1],
			cls: (
				m[2]
					.match(CLASS)
					?.slice(1)
					.find((c) => c !== undefined) ?? ''
			).trim()
		}))
		.filter((c) => c.tag === 'button' || /\bbtn-/.test(c.cls)),
	...[...text.matchAll(/\btriggerClass="([^"]*)"/g)].map((m) => ({
		file,
		tag: 'trigger',
		cls: m[1]
	}))
]);

const shared = (cls: string) => CLOSED_SET.some((name) => cls.split(/[^\w-]+/).includes(name));
const structural = (file: string, cls: string) =>
	STRUCTURAL.some(([f, c]) => f === file && c === cls);

describe('the closed set of controls', () => {
	test('the sweep reads the buttons it should', () => {
		expect(controls.filter((c) => c.tag === 'button').length).toBeGreaterThan(STRUCTURAL.length);
	});

	test('every button, and every btn- link, takes a shared class or is a named structural exception', () => {
		const offenders = controls
			.filter((c) => !shared(c.cls) && !(c.tag !== 'trigger' && structural(c.file, c.cls)))
			.map((c) => `${c.file}: <${c.tag} class="${c.cls}">`);
		expect(offenders).toEqual([]);
	});

	test('every structural exception still exists, so the list cannot go stale', () => {
		const stale = STRUCTURAL.filter(
			([f, c]) => !controls.some((x) => x.file === f && x.cls === c && x.tag === 'button')
		);
		expect(stale).toEqual([]);
	});
});
