import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchFilters from './SearchFilters.svelte';

const { gotoMock, page } = vi.hoisted(() => ({
	gotoMock: vi.fn(),
	page: { url: new URL('http://localhost/') }
}));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));
vi.mock('$app/state', () => ({ page }));

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
	page.url = new URL('http://localhost/');
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

	// Clear all sits at the row's end, so a press moves no pill and nothing
	// needs scrolling back into view.
	test('a filter press does not scroll the row', async () => {
		render(SearchFilters, { props: { availableTags } });
		await fireEvent.click(screen.getByRole('button', { name: 'Baking' }));
		await vi.waitFor(() => expect(gotoMock).toHaveBeenCalledTimes(1));
		await Promise.resolve();
		expect(scrollIntoView).not.toHaveBeenCalled();
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

	// Before hydration (or without JS) the form submits natively: a GET to the
	// current page, which both Search and Favorites read `q` and `tags` from.
	test('submits natively to the current page with q and the selected tags', () => {
		render(SearchFilters, {
			props: { availableTags, initialQuery: 'soup', initialTags: ['baking'] }
		});
		const form = input().closest('form')!;
		expect(form).not.toHaveAttribute('action');
		expect(new FormData(form).get('q')).toBe('soup');
		expect(new FormData(form).get('tags')).toBe('baking');
	});

	test('no tags field when no tag is selected', () => {
		render(SearchFilters, { props: { availableTags } });
		expect(new FormData(input().closest('form')!).has('tags')).toBe(false);
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
});

// Cookbook's All · Mine · Saved is its own `filter` param; the search box and
// the tags must carry it, and it them.
describe('SearchFilters keeps the page’s other params', () => {
	test('a search keeps a param it does not own', async () => {
		page.url = new URL('http://localhost/cookbook?filter=saved&q=old');
		render(SearchFilters, { props: { availableTags, initialQuery: 'old' } });
		await fireEvent.input(input(), { target: { value: 'soup' } });
		await fireEvent.submit(input().closest('form')!);
		expect(gotoMock.mock.calls[0][0]).toBe('?filter=saved&q=soup');
	});

	test('clearing everything it owns still keeps the other param', async () => {
		page.url = new URL('http://localhost/cookbook?filter=mine&tags=dessert');
		render(SearchFilters, { props: { availableTags, initialTags: ['dessert'] } });
		await fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));
		expect(gotoMock.mock.calls[0][0]).toBe('?filter=mine');
	});

	test('a repeated param keeps every value', () => {
		page.url = new URL('http://localhost/cookbook?x=1&x=2');
		render(SearchFilters, { props: { availableTags } });
		expect(new FormData(input().closest('form')!).getAll('x')).toEqual(['1', '2']);
	});

	test('the native form carries the other param too', () => {
		page.url = new URL('http://localhost/cookbook?filter=saved');
		render(SearchFilters, { props: { availableTags } });
		expect(new FormData(input().closest('form')!).get('filter')).toBe('saved');
	});
});

describe('SearchFilters friends toggle', () => {
	test('absent unless the page offers it', () => {
		render(SearchFilters, { props: { availableTags } });
		expect(screen.queryByRole('button', { name: 'Friends’ recipes' })).toBeNull();
	});

	test('pressing it narrows to friends, keeping the query', async () => {
		render(SearchFilters, { props: { availableTags, initialQuery: 'dal', friendsOnly: false } });
		const toggle = screen.getByRole('button', { name: 'Friends’ recipes' });
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(toggle);
		expect(gotoMock.mock.calls[0][0]).toBe('?q=dal&friends=1');
	});

	test('pressed, a press widens again', async () => {
		page.url = new URL('http://localhost/discover?friends=1');
		render(SearchFilters, { props: { availableTags, friendsOnly: true } });
		const toggle = screen.getByRole('button', { name: 'Friends’ recipes' });
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(toggle);
		expect(gotoMock.mock.calls[0][0]).toBe('/discover');
	});
});
