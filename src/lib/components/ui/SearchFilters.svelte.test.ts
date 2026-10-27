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
		expect(gotoMock).toHaveBeenCalledWith('?q=soup');
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
});
