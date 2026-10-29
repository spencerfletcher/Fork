import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SearchPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const data = { recipes: [], allTags: [], searchQuery: '', selectedTags: [] };

function renderSearch(overrides: Partial<typeof data> = {}) {
	return render(SearchPage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Search page empty state', () => {
	test('with a query or tags set, the message is followed by a Clear filters link', () => {
		renderSearch({ searchQuery: 'zzzz' });
		expect(screen.getByText(/No recipes found/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/search');
	});

	test('with nothing set, the message is followed by an All recipes link', () => {
		renderSearch();
		expect(screen.getByText(/Enter a recipe name/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute('href', '/recipes');
		expect(screen.queryByRole('link', { name: 'Clear filters' })).toBeNull();
	});
});
