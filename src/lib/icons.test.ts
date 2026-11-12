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

	// 2B (Spencer, 11 November 2026): a spiral notepad, the one Journal
	// drawing, the tab's and Add to Journal's. Its rings sit 4 apart, not
	// 3.5, so they stay three at 16px.
	test('the journal is a spiral notepad', () => {
		const journal = snippet('journalIcon');
		expect(journal).toContain('viewBox="0 0 24 24"');
		expect(journal).toContain('<rect x="5" y="5" width="14" height="16.5" rx="1.5" />');
		expect(journal).toContain('d="M8 3v4M12 3v4M16 3v4M8.5 11.5h7M8.5 15h7M8.5 18.5h4"');
	});
});

// Owner, 12 November 2026: "pill x bigger". Every removable pill (the
// Cookbook's tag, sort and Mine or Saved pills, the editor's tag pills) draws
// one ×, sized in em by the shared .pill-x, never a typed glyph.
describe("the removable pill's ×", () => {
	const app = sources.find((s) => s.file === 'app.css')!.text;
	const drawers = ['routes/cookbook/CookbookPicker.svelte', 'lib/components/ui/TagInput.svelte'];

	test('is one drawing, a cross on the 16px box', () => {
		expect(snippet('removeIcon')).toContain('d="M4.5 4.5l7 7M11.5 4.5l-7 7"');
	});

	test.each(drawers)('%s draws it through .pill-x, with no typed ×', (file) => {
		const text = sources.find((s) => s.file === file)!.text;
		expect(text).toContain("{@render removeIcon('pill-x')}");
		expect(text).not.toMatch(/^\s*(?:<span[^>]*>)?×(?:<\/span>)?\s*$/m);
	});

	test('sized in em, a touch above the pill text, and centred by its row with no offset', () => {
		const rule = app.match(/\.pill-x\s*\{([^}]*)\}/)?.[1] ?? '';
		expect(rule).toMatch(/width:\s*1\.25em/);
		expect(rule).toMatch(/height:\s*1\.25em/);
		expect(rule).not.toMatch(NUDGE);
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
