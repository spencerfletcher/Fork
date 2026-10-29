import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchFilters from './SearchFilters.svelte';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

const availableTags = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' }
];

const input = () => screen.getByRole('searchbox');

beforeEach(() => gotoMock.mockClear());

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
