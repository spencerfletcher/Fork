import { vi, describe, test, expect, beforeEach } from 'vitest';
import { cookieJar, loadEvent, loadPage } from '#lib/testing/actions.js';

const journal = vi.hoisted(() => ({
	ENTRIES_PER_PAGE: 30,
	journalOf: vi.fn(),
	journalSummary: vi.fn(),
	journalTwelveMonths: vi.fn(),
	ownEntry: vi.fn()
}));
vi.mock('#lib/server/journal.js', () => journal);
// A day no clock gives today, so the test sees the cook's day passed through.
const COOK_DAY = '2031-01-02';
const tz = vi.hoisted(() => ({ todayFor: vi.fn() }));
vi.mock('#lib/server/timeZone.js', () => tz);

import { load } from './+page.server';
import type { PageData } from './$types';

const USER = { id: 'cook-3' };
const entry = (id: number, cookedOn = '2026-11-01') => ({ id, cookedOn });
const SUMMARY = { months: [{ month: '2026-11-01', cooks: 3 }], dishes: 2, top: [] };
const COOKIES = cookieJar({ tz: 'Pacific/Auckland' });
const journalPage = (search = '') =>
	loadPage<PageData>(load, {
		...(loadEvent({ path: `/journal${search}`, user: USER }) as object),
		cookies: COOKIES
	});

beforeEach(() => {
	vi.clearAllMocks();
	journal.journalOf.mockResolvedValue({ entries: [entry(2), entry(1)], next: 'c1' });
	journal.journalSummary.mockResolvedValue({ total: 80 });
	journal.ownEntry.mockResolvedValue(null);
	journal.journalTwelveMonths.mockResolvedValue(SUMMARY);
	tz.todayFor.mockReturnValue(COOK_DAY);
});

describe('/journal load', () => {
	test('sends a signed-out visitor to log in', async () => {
		await expect(load(loadEvent({ path: '/journal', user: null }))).rejects.toMatchObject({
			status: 303
		});
	});

	test('one page of entries a Journal page long, its cursor, and the whole Journal’s summary', async () => {
		const data = await journalPage('?page=2');
		expect(journal.journalOf).toHaveBeenCalledWith(USER, {
			after: null,
			limit: 2 * journal.ENTRIES_PER_PAGE,
			per: journal.ENTRIES_PER_PAGE
		});
		expect(journal.journalSummary).toHaveBeenCalledWith(USER.id);
		expect(data).toMatchObject({ next: 'c1', total: 80 });
		expect(data.entries).toHaveLength(2);
	});

	test('?logged= names the day of an entry on the page, asking nothing more', async () => {
		const data = await journalPage('?logged=2');
		expect(data.logged).toEqual({ cookedOn: '2026-11-01' });
		expect(journal.ownEntry).not.toHaveBeenCalled();
	});

	test('?logged= for an entry dated long ago, past the first page, reads it on its own', async () => {
		journal.ownEntry.mockResolvedValue(entry(9, '2019-01-01'));
		const data = await journalPage('?logged=9');
		expect(journal.ownEntry).toHaveBeenCalledWith(USER, 9);
		expect(data.logged).toEqual({ cookedOn: '2019-01-01' });
	});

	test('?logged= for no entry of the cook’s says nothing', async () => {
		expect((await journalPage('?logged=404')).logged).toBeNull();
		expect((await journalPage('?logged=abc')).logged).toBeNull();
	});

	test('the last-12-months summary comes with the page, ending on the cook’s own today', async () => {
		const data = await journalPage('?page=2');
		expect(data.twelveMonths).toEqual(SUMMARY);
		expect(tz.todayFor).toHaveBeenCalledWith(COOKIES);
		expect(journal.journalTwelveMonths).toHaveBeenCalledWith(USER, COOK_DAY);
	});

	test('a Show more fetch (?after=) reads no summary: the page keeps the one it loaded', async () => {
		const data = await journalPage('?after=2026-11-01~2');
		expect(journal.journalTwelveMonths).not.toHaveBeenCalled();
		expect(data.twelveMonths).toBeNull();
	});
});
