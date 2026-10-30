import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchFilters from './SearchFilters.svelte';
import source from './SearchFilters.svelte?raw';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

const availableTags = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' }
];

const input = () => screen.getByRole('searchbox');

// jsdom has no layout, so no scrollIntoView; a stub records the calls.
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

beforeEach(() => {
	gotoMock.mockClear();
	scrollIntoView.mockClear();
});

describe('SearchFilters', () => {
	test('typing then clicking a tag navigates with what was typed, no delay', async () => {
		render(SearchFilters, { props: { availableTags } });
		await fireEvent.input(input(), { target: { value: 'cookie' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));
		expect(gotoMock).toHaveBeenCalledTimes(1);
		expect(gotoMock.mock.calls[0][0]).toBe('?q=cookie&tags=dessert');
	});

	test('submitting the search navigates with the query', async () => {
		render(SearchFilters, { props: { availableTags } });
		await fireEvent.input(input(), { target: { value: 'soup' } });
		await fireEvent.submit(input().closest('form')!);
		expect(gotoMock.mock.calls[0][0]).toBe('?q=soup');
	});

	test('a filter press navigates without dropping keyboard focus', async () => {
		render(SearchFilters, { props: { availableTags } });
		await fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));
		expect(gotoMock.mock.calls[0][1]).toMatchObject({ reset: false });
	});

	test('a pressed filter is scrolled into view once the row re-renders', async () => {
		render(SearchFilters, { props: { availableTags } });
		const baking = screen.getByRole('button', { name: 'Baking' });
		await fireEvent.click(baking);
		await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
		expect(scrollIntoView.mock.contexts[0]).toBe(baking);
		expect(scrollIntoView.mock.calls[0][0]).toMatchObject({ inline: 'nearest' });
	});

	test('Clear all leads the row, so it is in reach on a phone without scrolling', () => {
		render(SearchFilters, { props: { availableTags, initialTags: ['baking'] } });
		const row = screen.getByRole('group', { name: 'Filter by tag' });
		expect(row.querySelector('button')).toHaveTextContent('Clear all');
	});

	test('Clear all is one navigation with no tags', async () => {
		render(SearchFilters, {
			props: { availableTags, initialTags: ['dessert', 'baking'], initialQuery: 'x' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
		expect(gotoMock).toHaveBeenCalledTimes(1);
		expect(gotoMock.mock.calls[0][0]).toBe('?q=x');
	});

	test('toggling a selected tag off navigates without it', async () => {
		render(SearchFilters, { props: { availableTags, initialTags: ['dessert'] } });
		await fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));
		expect(gotoMock.mock.calls[0][0]).toBe(window.location.pathname);
	});

	test('the tag filters are a group of toggles with pressed state, not pills in a card', () => {
		const { container } = render(SearchFilters, {
			props: { initialTags: ['dessert'], availableTags }
		});
		// Toggles are not navigation: a group, not a nav landmark.
		expect(screen.queryByRole('navigation')).toBeNull();
		const row = screen.getByRole('group', { name: 'Filter by tag' });
		expect(row).toHaveClass('tag-tabs');
		expect(screen.getByRole('button', { name: 'Dessert' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Baking' })).toHaveAttribute('aria-pressed', 'false');
		expect(container.querySelector('.bg-white')).toBeNull();
	});

	test('no tag row at all when there is nothing to filter by', () => {
		render(SearchFilters, { props: { availableTags: [] } });
		expect(screen.queryByRole('group', { name: 'Filter by tag' })).toBeNull();
		expect(screen.queryByText(/no tags available/i)).toBeNull();
	});
});

describe('SearchFilters search box', () => {
	// The server matches title, description and ingredient names, so the box
	// says so rather than promising titles only.
	test('names what the search matches', () => {
		render(SearchFilters, { props: { availableTags } });
		expect(input()).toHaveAccessibleName('Search by name or ingredient');
		expect(input()).toHaveAttribute('placeholder', 'Search by name or ingredient…');
	});

	// The native × empties the field and fires `search`; the results and the
	// URL must clear with it.
	test('emptying the field with the × navigates without the query', async () => {
		render(SearchFilters, { props: { availableTags, initialQuery: 'garam' } });
		await fireEvent.input(input(), { target: { value: '' } });
		await fireEvent(input(), new Event('search'));
		expect(gotoMock).toHaveBeenCalledTimes(1);
		expect(gotoMock.mock.calls[0][0]).toBe(window.location.pathname);
	});

	test('the × keeps the selected tags', async () => {
		render(SearchFilters, {
			props: { availableTags, initialQuery: 'garam', initialTags: ['baking'] }
		});
		await fireEvent.input(input(), { target: { value: '' } });
		await fireEvent(input(), new Event('search'));
		expect(gotoMock.mock.calls[0][0]).toBe('?tags=baking');
	});

	// Enter on an empty box fires both `search` and submit; with no query in
	// the URL there is nothing to clear, so only the submit navigates.
	test('the search event does not navigate when the URL has no query', async () => {
		render(SearchFilters, { props: { availableTags } });
		await fireEvent(input(), new Event('search'));
		expect(gotoMock).not.toHaveBeenCalled();
	});

	test("the × is drawn in the field's ink, not browser blue", () => {
		const rule = source.match(/::-webkit-search-cancel-button\s*{([^}]*)}/)![1];
		expect(rule).toMatch(/-webkit-appearance:\s*none/);
		expect(rule).toMatch(/background-color:\s*currentColor/);
		expect(rule).toMatch(/width:\s*24px/);
		expect(rule).toMatch(/center \/ 16px no-repeat/);
	});
});
