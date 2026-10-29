import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SearchPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const data = {
	recipes: [],
	allTags: [],
	searchQuery: '',
	selectedTags: [] as string[],
	user: null as { id: string } | null
};

function renderSearch(overrides: Partial<typeof data> = {}) {
	return render(SearchPage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Search page results', () => {
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
		const { container } = renderSearch({ recipes: [1, 2, 3, 4, 5].map(card) as never });
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
});

describe('Search page empty state', () => {
	test('with tags set, the message is followed by a Clear filters link', () => {
		renderSearch({ searchQuery: 'zzzz', selectedTags: ['dessert'] });
		expect(screen.getByText(/No recipes found/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/search');
	});

	test('with only a query set, the link says what it does: Clear search', () => {
		renderSearch({ searchQuery: 'zzzz' });
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute('href', '/search');
		expect(screen.queryByRole('link', { name: 'Clear filters' })).toBeNull();
	});

	test('with nothing set, All recipes goes where the tabs’ All goes', () => {
		// Signed in, /recipes is My Recipes; browse is the home page.
		const { unmount } = renderSearch();
		expect(screen.getByText(/Enter a recipe name/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute('href', '/recipes');
		expect(screen.queryByRole('link', { name: 'Clear filters' })).toBeNull();
		unmount();
		renderSearch({ user: { id: 'u1' } });
		expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute('href', '/');
	});
});
