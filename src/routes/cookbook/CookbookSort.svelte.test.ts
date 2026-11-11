import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CookbookSort from './CookbookSort.svelte';
import { CARD_SORTS } from '#lib/listPage.js';

const { page, goto } = vi.hoisted(() => ({
	page: { url: new URL('http://localhost/cookbook') },
	goto: vi.fn()
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page }));

const select = () => screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement;

describe('CookbookSort', () => {
	beforeEach(() => {
		goto.mockReset();
		page.url = new URL('http://localhost/cookbook');
	});

	test('a native select named Sort, its orders in the menu’s order, the current one chosen', () => {
		render(CookbookSort, { props: { sort: 'stale', searching: false } });
		expect([...select().options].map((o) => [o.value, o.text])).toEqual([
			['newest', 'Newest change'],
			['cooked', 'Recently cooked'],
			['most', 'Most cooked'],
			['stale', 'Not cooked lately'],
			['title', 'Title A to Z']
		]);
		expect([...select().options].map((o) => o.value)).toEqual([...CARD_SORTS]);
		expect(select().value).toBe('stale');
	});

	test('choosing one goes there at once, keeping the filters and the focus, the place dropped', async () => {
		page.url = new URL('http://localhost/cookbook?filter=saved&view=list&page=3');
		render(CookbookSort, { props: { sort: 'newest', searching: false } });
		await fireEvent.change(select(), { target: { value: 'most' } });
		expect(goto).toHaveBeenCalledExactlyOnceWith('?filter=saved&view=list&sort=most', {
			reset: false
		});
	});

	test('Newest change is the bare URL', async () => {
		page.url = new URL('http://localhost/cookbook?sort=title&filter=mine');
		render(CookbookSort, { props: { sort: 'title', searching: false } });
		await fireEvent.change(select(), { target: { value: 'newest' } });
		expect(goto).toHaveBeenCalledExactlyOnceWith('?filter=mine', { reset: false });
	});

	test('while a search ranks the results, it says so and cannot be changed', () => {
		render(CookbookSort, { props: { sort: 'most', searching: true } });
		expect(select()).toBeDisabled();
		expect(select().selectedOptions[0].text).toBe('Best match');
	});
});
