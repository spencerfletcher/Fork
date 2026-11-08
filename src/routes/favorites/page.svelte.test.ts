import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FavoritesPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECIPE = {
	id: 1,
	slug: 'soup',
	title: 'Soup',
	description: null,
	imageUrl: null,
	parentId: null,
	prepTimeMinutes: null,
	cookTimeMinutes: null
};

const data = { recipes: [], allTags: [], searchQuery: '', selectedTags: [] };

function renderFavorites(overrides: Partial<typeof data> = {}) {
	return render(FavoritesPage, { props: { data: { ...data, ...overrides } } as never });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Favorites page', () => {
	test('with no favorites and no filter, only the empty state and its link render', () => {
		// A search box over an empty list invites a query with nothing to find
		// (decided 29 October 2026).
		renderFavorites();
		expect(screen.queryByRole('searchbox')).toBeNull();
		// It says where favoriting happens, in the recipe page button's own verb
		// (RecipeActions: "Favorite").
		expect(
			screen.getByText(/No favorites yet\. Favorite a recipe from its page\./)
		).toBeInTheDocument();
		expect(screen.queryByText(/Star/)).toBeNull();
		expect(screen.queryByText(/Tap/)).toBeNull();
		// The arrow form: 24px at desktop, a 44px thumb target on a phone.
		const explore = screen.getByRole('link', { name: 'Explore recipes →' });
		expect(explore).toHaveAttribute('href', '/');
		expect(explore).toHaveClass('arrow-link');
	});

	test('with favorites the search and tag filters render', () => {
		renderFavorites({ recipes: [RECIPE] as never });
		expect(screen.getByRole('searchbox')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: '1 recipe' })).toBeInTheDocument();
	});

	test('a filter that empties the list keeps the filters, so it can be widened again', () => {
		renderFavorites({ searchQuery: 'zzz' });
		expect(screen.getByRole('searchbox')).toBeInTheDocument();
		expect(screen.getByText(/No favorites match your filters/)).toBeInTheDocument();
	});
});

// The results swap in place, so a screen reader hears the count from a status
// region that is always in the DOM.
describe('Favorites page result count', () => {
	test('a filter announces how many favorites match', () => {
		renderFavorites({
			searchQuery: 'soup',
			recipes: [RECIPE, { ...RECIPE, id: 2 }] as never
		});
		expect(screen.getByRole('status')).toHaveTextContent('2 favorites match');
	});

	test('one result reads as a sentence', () => {
		renderFavorites({ searchQuery: 'soup', recipes: [RECIPE] as never });
		expect(screen.getByRole('status')).toHaveTextContent('1 favorite matches');
	});

	test('a filter with no results announces that nothing matched', () => {
		renderFavorites({ searchQuery: 'zzz' });
		expect(screen.getByRole('status')).toHaveTextContent('0 favorites match');
	});

	test('without a filter the region is present and silent', () => {
		renderFavorites({ recipes: [RECIPE] as never });
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});
});
