import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

// DESIGN.md, Icons beside text: an icon is centred on its words by the row
// (`align-items: center`), never nudged into place by a pixel offset. An
// offset is tuned to one browser's font metrics and sits wrong in another
// (the Friends filter's icon on iOS, 11 November 2026).

const src = new URL('..', import.meta.url);
const sources = readdirSync(src, { recursive: true })
	.map(String)
	.filter((f) => f.endsWith('.svelte') || f.endsWith('.css'))
	.map((file) => ({ file, text: readFileSync(new URL(file, src), 'utf8') }));

// A rule whose selector ends at an icon: `.icon`, `:global(.icon)` or `svg`.
const ICON_RULE = /([^{}]*(?:\.icon\)?|\bsvg)\s*)\{([^{}]*)\}/g;
const NUDGE =
	/(?:^|;)\s*(margin-top|margin-bottom|margin-block[a-z-]*|top|bottom|translate|vertical-align|align-self)\s*:|transform\s*:[^;]*translateY/;

const icons = sources.find((s) => s.file.endsWith('components/Icons.svelte'))!.text;
/** The markup of one snippet in Icons.svelte, up to its {/snippet}. */
const snippet = (name: string) => {
	const at = icons.indexOf(`{#snippet ${name}(`);
	return at < 0 ? '' : icons.slice(at, icons.indexOf('{/snippet}', at));
};

describe('the shared drawings', () => {
	// 1A (Spencer, 11 November 2026): three tines on a round shoulder, a
	// straight handle. A redesign candidate, so the drawing is pinned here.
	test('the fork is three tines on a round shoulder', () => {
		expect(snippet('forkIcon')).toContain('d="M5 1.5V5a3 3 0 0 0 6 0V1.5M8 1.5v13"');
	});
});

describe('icons beside text', () => {
	test('no icon is placed by a vertical offset', () => {
		const nudged = sources.flatMap(({ file, text }) =>
			[...text.matchAll(ICON_RULE)]
				.filter(([, , body]) => NUDGE.test(body))
				.map(([, selector]) => `${file}: ${selector.trim().split('\n').at(-1)!.trim()}`)
		);
		expect(nudged).toEqual([]);
	});
});
