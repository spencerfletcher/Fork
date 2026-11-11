import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PrintHeader from './PrintHeader.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';
import { formatServes } from '#lib/recipes/scale.js';

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
			stored: 4,
			serves: 4,
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
		const { lines } = renderHeader({ stored, serves });
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

	test('a recipe with no servings prints its version alone', () => {
		const { lines } = renderHeader({ stored: 0, serves: 0 });
		expect(lines[2]).toBe('v3 · Makes 12 cookies');
	});
});
