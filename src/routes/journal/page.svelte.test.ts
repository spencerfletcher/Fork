import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { SUMMARY_MONTHS, summaryMonths } from '#lib/journal.js';
import JournalPage from './+page.svelte';

const { preloadMock, page } = vi.hoisted(() => ({
	preloadMock: vi.fn(),
	page: { url: new URL('http://localhost/journal'), shallow: null, state: {} }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), preloadData: preloadMock, snapshot: vi.fn() }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const entry = (id: number, cookedOn: string) => ({
	id,
	userId: 'me',
	recipeId: null,
	versionId: null,
	dish: `Dish ${id}`,
	cookedOn,
	servings: null,
	photoUrl: null,
	caption: null,
	note: null,
	audience: 'private',
	createdAt: new Date(),
	sourceUrl: null,
	source: { kind: 'improvised' }
});

const data = {
	entries: [entry(3, '2026-11-08'), entry(2, '2026-10-20')],
	next: 'c2' as string | null,
	total: 40,
	oldest: '2024-05-01',
	logged: null as { cookedOn: string } | null,
	twelveMonths: null as null | {
		months: { month: string; cooks: number }[];
		dishes: number;
		top: { recipeId: number; times: number; title: string; href: string | null }[];
	}
};
const SUMMARY = {
	months: summaryMonths('2026-11-12').map((month, i) => ({ month, cooks: i })),
	dishes: 3,
	top: [{ recipeId: 1, times: 4, title: 'Miso Salmon', href: '/recipes/miso-salmon' }]
};
const HEADING = `Last ${SUMMARY_MONTHS} months`;

const renderJournal = (overrides: Partial<typeof data> = {}) =>
	render(JournalPage, { props: { data: { ...data, ...overrides } } as never });

describe('Journal page', () => {
	test('the summary counts the whole Journal from its oldest month, not the entries shown', () => {
		renderJournal();
		expect(screen.getByText('40 entries since May')).toBeInTheDocument();
	});

	test('Logged names the day the server found, on this page or not', () => {
		renderJournal({ logged: { cookedOn: '2019-01-01' } });
		expect(screen.getByText(/1 Jan 2019/)).toBeInTheDocument();
	});

	test('Show more appends the next entries, joining the last month, and focuses the first', async () => {
		preloadMock.mockResolvedValue({
			type: 'loaded',
			status: 200,
			data: { ...data, entries: [entry(1, '2026-10-02')], next: null }
		});
		renderJournal();

		await fireEvent.click(screen.getByRole('link', { name: 'Show more' }));

		await waitFor(() => expect(screen.getByText('1 more entry')).toBeInTheDocument());
		const october = screen.getByRole('heading', { level: 2, name: 'October 2026' }).parentElement!;
		expect(october.querySelectorAll('article')).toHaveLength(2);
		expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
		expect(document.activeElement).toBe(document.getElementById('entry-1'));
		expect(screen.queryByRole('link', { name: 'Show more' })).toBeNull();
	});

	test('the last-12-months summary sits above the month groups, its headings before theirs', () => {
		renderJournal({ twelveMonths: SUMMARY });
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
			HEADING,
			`Most cooked in the last ${SUMMARY_MONTHS} months`,
			'November 2026',
			'October 2026'
		]);
	});

	test('no summary without entries in the last 12 months', () => {
		renderJournal();
		expect(screen.queryByRole('heading', { name: HEADING })).toBeNull();
	});

	test('Show more leaves the summary as the page loaded it', async () => {
		preloadMock.mockResolvedValue({
			type: 'loaded',
			status: 200,
			data: { ...data, entries: [entry(1, '2026-10-02')], next: null, twelveMonths: null }
		});
		renderJournal({ twelveMonths: SUMMARY });
		await fireEvent.click(screen.getByRole('link', { name: 'Show more' }));
		await waitFor(() => expect(screen.getByText('1 more entry')).toBeInTheDocument());
		expect(screen.getByRole('link', { name: 'Miso Salmon' })).toBeInTheDocument();
		expect(screen.getAllByRole('heading', { name: HEADING })).toHaveLength(1);
	});
});
