import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TagPage from './+page.svelte';

const data = {
	tag: { id: 1, name: 'Dessert', slug: 'dessert' },
	tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }],
	recipes: [] as unknown[],
	user: null as { id: string } | null
};

function renderTag(overrides: Partial<typeof data> = {}) {
	return render(TagPage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Tag page', () => {
	test('cards know their place, so the first row of photos loads eagerly', () => {
		const card = (id: number) => ({
			id,
			slug: `r${id}`,
			title: `R${id}`,
			description: null,
			imageUrl: `https://img/${id}.jpg`,
			parentId: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		});
		const { container } = renderTag({ recipes: [1, 2, 3, 4, 5].map(card) });
		const imgs = [...container.querySelectorAll('img.card-img')];
		expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
		expect(imgs.map((img) => img.getAttribute('loading'))).toEqual([
			'eager',
			'eager',
			'eager',
			'eager',
			'lazy'
		]);
	});

	test('the empty state’s Explore all goes to the browse list, not the landing', () => {
		const { unmount } = renderTag();
		expect(screen.getByRole('link', { name: 'Explore all →' })).toHaveAttribute('href', '/recipes');
		unmount();
		renderTag({ user: { id: 'u1' } });
		expect(screen.getByRole('link', { name: 'Explore all →' })).toHaveAttribute('href', '/');
	});
});
