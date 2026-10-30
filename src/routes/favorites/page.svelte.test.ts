import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FavoritesPage from './+page.svelte';
import source from './+page.svelte?raw';

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

const data = { favoriteRecipes: [], allTags: [], searchQuery: '', selectedTags: [] };

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
		// It says where favoriting happens, in a verb a mouse user can follow too.
		expect(screen.getByText(/No favorites yet\. Star any recipe\./)).toBeInTheDocument();
		expect(screen.queryByText(/Tap/)).toBeNull();
		// The arrow form: 24px at desktop, a 44px thumb target on a phone.
		const explore = screen.getByRole('link', { name: 'Explore recipes →' });
		expect(explore).toHaveAttribute('href', '/');
		expect(explore).toHaveClass('arrow-link');
	});

	test('with favorites the search and tag filters render', () => {
		renderFavorites({ favoriteRecipes: [RECIPE] as never });
		expect(screen.getByRole('searchbox')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: '1 recipe' })).toBeInTheDocument();
	});

	test('a filter that empties the list keeps the filters, so it can be widened again', () => {
		renderFavorites({ searchQuery: 'zzz' });
		expect(screen.getByRole('searchbox')).toBeInTheDocument();
		expect(screen.getByText(/No favorites match your filters/)).toBeInTheDocument();
	});

	test("the empty state sits one gap under the h1, the header's own, not the shared rule's 2rem more", () => {
		renderFavorites();
		const empty = screen.getByText(/No favorites yet/);
		expect(empty.className).not.toMatch(/\bmt-/);
		expect(source).toMatch(/\.empty-state\s*{[^}]*padding-top:\s*0/);
	});

	test("under the filters the empty state keeps the results' gap above it", () => {
		renderFavorites({ searchQuery: 'zzz' });
		expect(screen.getByText(/No favorites match your filters/)).toHaveClass('mt-6');
	});
});
