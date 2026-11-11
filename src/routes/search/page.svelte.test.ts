import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import SearchPage from './+page.svelte';

const { preloadMock } = vi.hoisted(() => ({ preloadMock: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), preloadData: preloadMock }));

const data = {
	recipes: [],
	allTags: [],
	searchQuery: '',
	selectedTags: [] as string[],
	friendsOnly: undefined as boolean | undefined,
	user: null as { id: string } | null
};

/** One page, the whole list: the total is the cards given, and no page follows. */
function renderSearch(overrides: Partial<typeof data> = {}) {
	const shown = { ...data, ...overrides };
	return render(SearchPage, {
		props: { data: { ...shown, total: shown.recipes.length, next: null } } as never
	});
}

const card = (id: number) => ({
	id,
	slug: `r${id}`,
	title: `R${id}`,
	description: null,
	imageUrl: null,
	parentId: null,
	prepTimeMinutes: null,
	cookTimeMinutes: null
});

describe('Search page, a list longer than a page', () => {
	test('counts the whole list, and Show more appends the next page after the first', async () => {
		preloadMock.mockResolvedValue({
			type: 'loaded',
			status: 200,
			data: { ...data, recipes: [card(3), card(4)], next: null, total: 4 }
		});
		render(SearchPage, {
			props: { data: { ...data, recipes: [card(1), card(2)], next: 'c2', total: 4 } } as never
		});
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('4 recipes');

		await fireEvent.click(screen.getByRole('link', { name: 'Show more' }));

		await waitFor(() =>
			expect(
				screen.getAllByRole('link', { name: /^R\d$/ }).map((a) => a.getAttribute('href'))
			).toEqual(['/recipes/r1', '/recipes/r2', '/recipes/r3', '/recipes/r4'])
		);
		expect(screen.queryByRole('link', { name: 'Show more' })).toBeNull();
		expect(screen.getByText('2 more recipes')).toBeInTheDocument();
	});
});

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
		expect(screen.getByText(/No recipes match “zzzz” with these filters/)).toBeInTheDocument();
		// It clears the tags only: the query stays.
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
			'href',
			'/search?q=zzzz'
		);
	});

	test('Clear filters keeps the query encoded, and with tags alone goes to bare /search', () => {
		const { unmount } = renderSearch({ searchQuery: 'mac & cheese', selectedTags: ['dessert'] });
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
			'href',
			'/search?q=mac%20%26%20cheese'
		);
		unmount();
		renderSearch({ selectedTags: ['dessert'] });
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/search');
	});

	test('with a query and filters, Clear search drops the query and keeps the tags and Friends', () => {
		renderSearch({ searchQuery: 'zzzz', selectedTags: ['dessert', 'quick'], friendsOnly: true });
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute(
			'href',
			`/search?tags=${encodeURIComponent('dessert,quick')}&friends=1`
		);
	});

	test('with filters and no query, the message names the filters and offers Clear filters alone', () => {
		renderSearch({ selectedTags: ['dessert'] });
		expect(screen.getByText(/No recipes match these filters/)).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Clear search' })).toBeNull();
	});

	test('with only a query set, the link says what it does: Clear search', () => {
		renderSearch({ searchQuery: 'zzzz' });
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute('href', '/search');
		expect(screen.queryByRole('link', { name: 'Clear filters' })).toBeNull();
	});

	test('with nothing set, All recipes goes to Discover, where the tabs’ All goes', () => {
		const { unmount } = renderSearch();
		expect(screen.getByText(/Enter a recipe name/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute('href', '/discover');
		expect(screen.queryByRole('link', { name: 'Clear filters' })).toBeNull();
		unmount();
		renderSearch({ user: { id: 'u1' } });
		expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute('href', '/discover');
	});

	test('with the Friends filter on, Clear filters drops it and keeps the query', () => {
		renderSearch({ searchQuery: 'dal', friendsOnly: true });
		expect(screen.getByText(/No recipes match “dal” with these filters/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
			'href',
			'/search?q=dal'
		);
		expect(screen.getByRole('status')).toHaveTextContent('0 recipes match');
	});
});

describe('Search page Friends filter', () => {
	test('shows only when the loader offers it, pressed while on', () => {
		const { unmount } = renderSearch();
		expect(screen.queryByRole('button', { name: 'Friends’ recipes' })).toBeNull();
		unmount();
		renderSearch({ friendsOnly: true });
		expect(screen.getByRole('button', { name: 'Friends’ recipes' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});
});

// The results swap in place, so a screen reader hears the count from a status
// region that is always in the DOM.
describe('Search page result count', () => {
	const card = {
		id: 1,
		slug: 'soup',
		title: 'Soup',
		description: null,
		imageUrl: null,
		parentId: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null
	};

	test('a filtered search announces how many recipes it found', () => {
		renderSearch({ searchQuery: 'soup', recipes: [card] as never });
		expect(screen.getByRole('status')).toHaveTextContent('1 recipe matches');
	});

	test('a filter with no results announces that nothing was found', () => {
		renderSearch({ selectedTags: ['dessert'] });
		expect(screen.getByRole('status')).toHaveTextContent('0 recipes match');
	});

	test('without a filter the region is present and silent', () => {
		renderSearch({ recipes: [card, { ...card, id: 2, slug: 'stew' }] as never });
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});
});
