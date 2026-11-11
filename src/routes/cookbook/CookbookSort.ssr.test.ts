import { describe, test, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import CookbookSort from './CookbookSort.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/cookbook?filter=saved&sort=cooked&page=2') }
}));

// Before hydration, or without JavaScript, the select submits with a button.
describe('CookbookSort, server rendered', () => {
	test('a GET form of the page’s other params, the place dropped, and a Sort button', () => {
		const { body } = render(CookbookSort, { props: { sort: 'cooked', searching: false } });
		expect(body).toMatch(/<form[^>]*method="get"/i);
		expect(body).toMatch(/<input type="hidden" name="filter" value="saved"/);
		expect(body).not.toContain('name="page"');
		expect(body).not.toMatch(/type="hidden" name="sort"/);
		expect(body).toMatch(/<select[^>]*name="sort"/);
		expect(body).toMatch(/<option value="cooked"[^>]*selected/);
		expect(body).toMatch(
			/<noscript><button type="submit" class="btn-ghost btn-sm">Sort<\/button><\/noscript>/
		);
	});
});
