import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PrintHeader from './PrintHeader.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';
import { formatServes, scaling } from '#lib/recipes/scale.js';

const HREF = 'https://fork.test/recipes/cookies-abc?serves=6';

function renderHeader(overrides: Partial<Parameters<typeof render<typeof PrintHeader>>[1]> = {}) {
	const { container } = render(PrintHeader, {
		props: {
			recipe: { author: { username: 'maya' }, parent: null, parentId: null },
			content: makeContent({
				title: 'Cookies',
				description: 'Chewy.',
				makes: '12 cookies',
				prepTimeMinutes: 15,
				cookTimeMinutes: 13
			}),
			versionNumber: 3,
			scale: scaling({ servings: 4, makes: '12 cookies' }, null),
			href: HREF,
			...overrides
		}
	});
	const lines = [...container.querySelectorAll('.print-header > *')].map((e) =>
		e.textContent?.replace(/\s+/g, ' ').trim()
	);
	return { container, lines };
}

describe('PrintHeader', () => {
	test('prints the rest with the times and the source in full, its address too', () => {
		const { lines } = renderHeader({
			content: makeContent({
				title: 'Cookies',
				prepTimeMinutes: 15,
				cookTimeMinutes: 13,
				restTimeMinutes: 120,
				sourceName: 'Jerusalem',
				sourceUrl: 'https://example.com/a'
			})
		});
		expect(lines).toContain('15 min prep · 13 min cook · 2 h rest');
		expect(lines).toContain('Source: Jerusalem · https://example.com/a');
	});

	test('title, byline, version and serves, times, description and the address', () => {
		const { lines } = renderHeader();
		expect(lines).toEqual([
			'Cookies',
			'By @maya',
			'v3 · Serves 4 · Makes 12 cookies',
			'15 min prep · 13 min cook',
			'Chewy.',
			HREF
		]);
	});

	test('scaled, it says the serves in effect and the multiplier, and scales the yield', () => {
		const [stored, serves] = [4, 6];
		const { lines } = renderHeader({
			scale: scaling({ servings: stored, makes: '12 cookies' }, serves)
		});
		expect(lines[2]).toBe(
			`v3 · Serves ${serves}, scaled ${formatServes(serves / stored)}x · Makes 18 cookies`
		);
	});

	test('a fork names its parent', () => {
		const { lines } = renderHeader({
			recipe: { author: { username: 'maya' }, parent: { title: 'Gran’s cookies' }, parentId: 9 }
		});
		expect(lines[1]).toBe('By @maya · forked from Gran’s cookies');
	});

	test('a fork that recorded the version it copied names it', () => {
		const { lines } = renderHeader({
			recipe: {
				author: { username: 'maya' },
				parent: { title: 'Gran’s cookies' },
				parentId: 9,
				parentVersion: 2
			}
		});
		expect(lines[1]).toBe('By @maya · forked from Gran’s cookies, v2');
	});

	test("a fork names its parent's author by handle, mono as the fork's own", () => {
		const { container, lines } = renderHeader({
			recipe: {
				author: { username: 'maya' },
				parent: { title: 'Gran’s cookies', author: { username: 'gran' } },
				parentId: 9,
				parentVersion: 2
			}
		});
		expect(lines[1]).toBe("By @maya · forked from @gran's Gran’s cookies, v2");
		expect([...container.querySelectorAll('.mono-id')].map((e) => e.textContent)).toEqual([
			'@maya',
			'@gran'
		]);
	});

	test('a hidden parent prints the private wording, no handle', () => {
		const { lines } = renderHeader({
			recipe: { author: { username: 'maya' }, parent: null, parentId: 9 }
		});
		expect(lines[1]).toBe('By @maya · forked from a private recipe');
	});

	test('a recipe with no servings prints its version alone', () => {
		const { lines } = renderHeader({
			scale: scaling({ servings: null, makes: '12 cookies' }, null)
		});
		expect(lines[2]).toBe('v3 · Makes 12 cookies');
	});

	test('a Makes-only recipe scaled says its multiplier after the yield', () => {
		const { lines } = renderHeader({ scale: scaling({ servings: null, makes: '12 cookies' }, 24) });
		expect(lines[2]).toBe(`v3 · Makes 24 cookies, scaled ${formatServes(24 / 12)}x`);
	});
});
