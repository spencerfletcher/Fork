import { describe, test, expect } from 'vitest';
import { toMarkdown } from './markdown.js';
import { EXPORT_FORMAT, EXPORT_VERSION, type ExportRecipe, type ForkExport } from './archive.js';
import { makeBuns, makeContent } from '#lib/recipes/fixtures.js';
import { formatDuration } from '#lib/recipes/times.js';

const buns = makeBuns();
const first = makeContent({ title: 'First buns' });

function makeRecipe(overrides: Partial<ExportRecipe> = {}): ExportRecipe {
	return {
		slug: 'cinnamon-buns',
		url: 'https://fork.test/recipes/cinnamon-buns',
		audience: 'private',
		tags: ['Baking'],
		createdAt: '2026-10-01T09:00:00.000Z',
		updatedAt: '2026-11-01T09:00:00.000Z',
		inTrashSince: null,
		forkedFrom: null,
		versions: [
			{ number: 1, date: '2026-10-01T09:00:00.000Z', message: 'First try', content: first },
			{ number: 2, date: '2026-11-01T09:00:00.000Z', message: 'More rest', content: buns }
		],
		...overrides
	};
}

function makeExport(overrides: Partial<ForkExport> = {}): ForkExport {
	return {
		format: EXPORT_FORMAT,
		version: EXPORT_VERSION,
		exportedAt: '2026-11-11T12:00:00.000Z',
		scope: 'library',
		profile: {
			username: 'cook',
			url: 'https://fork.test/users/cook',
			avatarUrl: null,
			joinedAt: '2026-01-01T00:00:00.000Z'
		},
		recipes: [makeRecipe()],
		collections: [],
		saves: [],
		journal: [],
		...overrides
	};
}

/** The text between a heading line and the next heading of the same or a higher level. */
function sectionOf(md: string, heading: string): string {
	const lines = md.split('\n');
	const start = lines.indexOf(heading);
	expect(start, heading).toBeGreaterThan(-1);
	const level = heading.indexOf(' ');
	const end = lines.findIndex((l, i) => i > start && /^#+ /.test(l) && l.indexOf(' ') <= level);
	return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

describe('the readable export', () => {
	const md = toMarkdown(makeExport());

	test('the latest version in full: every group, ingredient, step, note, time and the source', () => {
		const [latest] = sectionOf(md, `## ${buns.title}`).split('### Earlier versions');
		const lines = latest.split('\n');
		// Twice each: once over its ingredients, once over its steps.
		for (const row of [...buns.ingredients, ...buns.steps])
			expect(lines.filter((l) => l === `##### ${row.group}`)).toHaveLength(2);
		for (const i of buns.ingredients) expect(latest).toContain(`- ${i.text}`);
		buns.steps.forEach((s, n) => {
			expect(latest).toContain(`${n + 1}. ${s.text}`);
			if (s.annotation) expect(latest).toContain(s.annotation.text);
		});
		for (const line of buns.notes!.split('\n')) expect(latest).toContain(line);
		for (const field of [buns.makeAhead, buns.equipment, buns.storage, buns.reheating])
			expect(latest).toContain(field!);
		for (const minutes of [buns.prepTimeMinutes, buns.cookTimeMinutes, buns.restTimeMinutes])
			expect(latest).toContain(formatDuration(minutes!));
		expect(latest).toContain(buns.makes!);
		expect(latest).toContain(`[${buns.sourceName}](${buns.sourceUrl})`);
		expect(latest).toContain(buns.imageUrl!);
		expect(latest).toContain(buns.description!);
	});

	test('the latest version comes before the earlier ones, each listed with its number and message', () => {
		expect(md.indexOf(buns.steps[0].text)).toBeLessThan(md.indexOf('### Earlier versions'));
		const earlier = sectionOf(md, '### Earlier versions');
		expect(earlier).toContain('v1');
		expect(earlier).toContain('First try');
		expect(earlier).toContain(first.ingredients[0].text);
		expect(earlier).not.toContain('More rest');
	});

	test('a heading names the cook, the day and the photo limitation', () => {
		expect(md.startsWith('# ')).toBe(true);
		expect(md).toContain('@cook');
		expect(md).toContain('2026-11-11');
		expect(md).toMatch(/photos are linked/i);
	});

	test('a trashed recipe and a fork say so', () => {
		const out = toMarkdown(
			makeExport({
				recipes: [
					makeRecipe({
						inTrashSince: '2026-11-05T00:00:00.000Z',
						forkedFrom: {
							slug: 'p',
							url: 'https://fork.test/recipes/p',
							title: 'Parent buns',
							author: 'ana',
							version: null
						}
					})
				]
			})
		);
		expect(out).toMatch(/In the Trash since 2026-11-05/);
		expect(out).toContain('Forked from [Parent buns](https://fork.test/recipes/p) by @ana');
	});

	test('a fork that recorded the version it copied links and names that version', () => {
		const forkedFrom = {
			slug: 'p',
			url: 'https://fork.test/recipes/p',
			title: 'Parent buns',
			author: 'ana',
			version: 2
		};
		const out = toMarkdown(makeExport({ recipes: [makeRecipe({ forkedFrom })] }));
		expect(out).toContain(
			'Forked from [Parent buns](https://fork.test/recipes/p?version=2), v2 by @ana'
		);
	});

	test('saves, collections and the Journal are listed by reference', () => {
		const ref = {
			slug: 's',
			url: 'https://fork.test/recipes/s',
			title: 'Ana’s soup',
			author: 'ana'
		};
		const out = toMarkdown(
			makeExport({
				saves: [
					{
						...ref,
						savedAt: '2026-11-01T00:00:00.000Z',
						keptVersion: 2,
						keptCopy: null,
						note: 'Less salt.'
					}
				],
				collections: [
					{
						name: 'Weeknights',
						createdAt: '2026-11-01T00:00:00.000Z',
						recipes: [{ ...ref, addedAt: '2026-11-01T00:00:00.000Z' }]
					}
				],
				journal: [
					{
						cookedOn: '2026-11-03',
						dish: 'Soup night',
						source: { kind: 'recipe', slug: 's', url: ref.url, title: ref.title, version: 2 },
						servings: 4,
						caption: null,
						note: 'Good.',
						photoUrl: 'https://example.com/soup.jpg',
						audience: 'private'
					}
				]
			})
		);
		expect(sectionOf(out, '## Saved recipes')).toContain(`[${ref.title}](${ref.url})`);
		expect(sectionOf(out, '## Saved recipes')).toContain('Less salt.');
		expect(sectionOf(out, '## Collections')).toContain('### Weeknights');
		const journal = sectionOf(out, '## Journal');
		for (const s of ['2026-11-03', 'Soup night', 'Good.', 'https://example.com/soup.jpg', 'v2'])
			expect(journal).toContain(s);
	});
});
