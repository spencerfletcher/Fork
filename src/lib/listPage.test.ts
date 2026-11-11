import { describe, test, expect } from 'vitest';
import { CARDS_PER_PAGE, listPage, MAX_PAGES, withoutPlace } from './listPage';

const url = (search: string) => new URL(`http://localhost/discover${search}`);

describe('listPage', () => {
	test('a bare URL is the first page', () => {
		expect(listPage(url(''))).toEqual({ after: null, limit: CARDS_PER_PAGE, per: CARDS_PER_PAGE });
	});

	test('?page=N is the first N pages in one read', () => {
		expect(listPage(url('?page=3'))).toEqual({
			after: null,
			limit: 3 * CARDS_PER_PAGE,
			per: CARDS_PER_PAGE
		});
	});

	test('?after= is one page after the cursor, whatever ?page says', () => {
		expect(listPage(url('?after=abc&page=3'))).toEqual({
			after: 'abc',
			limit: CARDS_PER_PAGE,
			per: CARDS_PER_PAGE
		});
	});

	test('a page count past the cap reads the cap', () => {
		expect(listPage(url(`?page=${MAX_PAGES + 5}`)).limit).toBe(MAX_PAGES * CARDS_PER_PAGE);
	});

	test('a page count that is not a whole number above nought is the first page', () => {
		for (const bad of ['0', '-2', 'two', '1.5', ''])
			expect(listPage(url(`?page=${bad}`)).limit).toBe(CARDS_PER_PAGE);
	});

	test('?per= shrinks a page and never grows it', () => {
		expect(listPage(url('?per=2&page=3'))).toEqual({ after: null, limit: 6, per: 2 });
		expect(listPage(url(`?per=${CARDS_PER_PAGE * 4}`)).per).toBe(CARDS_PER_PAGE);
		expect(listPage(url('?per=0')).per).toBe(CARDS_PER_PAGE);
	});

	test("a list's own page size is the ceiling it shrinks from", () => {
		expect(listPage(url(''), 10).per).toBe(10);
		expect(listPage(url('?per=50'), 10).per).toBe(10);
	});
});

describe('withoutPlace', () => {
	test('drops the loaded place and keeps every filter', () => {
		const params = new URLSearchParams('q=soup&page=3&after=x&tags=quick&per=2');
		expect(withoutPlace(params).toString()).toBe('q=soup&tags=quick&per=2');
	});
});
