import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import BrowseSections from './BrowseSections.svelte';
import source from './BrowseSections.svelte?raw';
import { browseSections, RECENT_LIMIT } from '#lib/recipes/browse.js';

const card = (id: number, forkCount = 0) => ({
	id,
	slug: `recipe-${id}`,
	title: `Recipe ${id}`,
	description: null,
	imageUrl: `https://img/${id}.jpg`,
	parentId: null,
	prepTimeMinutes: null,
	cookTimeMinutes: null,
	updatedAt: new Date(2026, 0, id),
	forkCount
});

// Enough for all three sections: a full Recent, then older forked and unforked.
const recipes = Array.from({ length: RECENT_LIMIT + 3 }, (_, i) => card(i + 1, i === 0 ? 2 : 0));

describe('BrowseSections', () => {
	test('one browse section per group, titled by its eyebrow', () => {
		const { container } = render(BrowseSections, { props: { recipes } });
		const expected = browseSections(recipes).map((s) => s.title);
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
			expected
		);
		expect(container.querySelectorAll('section.browse-section .recipe-grid')).toHaveLength(
			expected.length
		);
	});

	test('only the first section indexes its cards, so only its photos load eagerly', () => {
		const { container } = render(BrowseSections, { props: { recipes } });
		const [first, ...rest] = container.querySelectorAll('section.browse-section');
		expect(first.querySelector('img')).toHaveAttribute('fetchpriority', 'high');
		for (const section of rest) {
			for (const img of section.querySelectorAll('img')) {
				expect(img).toHaveAttribute('loading', 'lazy');
				expect(img).not.toHaveAttribute('fetchpriority');
			}
		}
	});

	test('sections after the first sit 34px below the one before', () => {
		expect(source).toMatch(/\.browse-section \+ \.browse-section \{\s*margin-top: 34px;/);
	});
});
