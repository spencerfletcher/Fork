import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { plural } from '#lib/helpers.js';
import { monthLabel, monthTone, SUMMARY_MONTHS, summaryMonths } from '#lib/journal.js';
import JournalTwelveMonths from './JournalTwelveMonths.svelte';

// April 2030 to March 2031: the year changes in the window.
const COUNTS = [4, 0, 2, 8, 0, 0, 1, 0, 0, 3, 0, 5];
const MONTHS = summaryMonths('2031-03-05').map((month, i) => ({
	month,
	cooks: COUNTS[i]
}));
const HEADING = `Last ${SUMMARY_MONTHS} months`;
const TOP_HEADING = `Most cooked in the last ${SUMMARY_MONTHS} months`;
const TOP = [
	{ recipeId: 1, times: 5, title: 'Miso Salmon', href: '/recipes/miso-salmon' },
	{ recipeId: 2, times: 1, title: 'Dish from a recipe now gone', href: null }
];
const DISHES = 9;
const renderSummary = (overrides = {}) =>
	render(JournalTwelveMonths, {
		props: { summary: { months: MONTHS, dishes: DISHES, top: TOP, ...overrides } }
	});

describe('JournalTwelveMonths', () => {
	test('the twelve months, oldest first, each read as its month, year and count', () => {
		renderSummary();
		expect(screen.getByRole('heading', { level: 2, name: HEADING })).toBeInTheDocument();
		const months = within(screen.getByRole('list', { name: HEADING })).getAllByRole('listitem');
		expect(months.map((m) => m.querySelector('.sr-only')?.textContent?.trim())).toEqual(
			MONTHS.map((m) => `${monthLabel(m.month)}: ${plural(m.cooks, 'cook')}`)
		);
	});

	test('the totals: every cook in the window, and how many different dishes', () => {
		const cooks = COUNTS.reduce((a, b) => a + b, 0);
		renderSummary();
		expect(
			screen.getByText(`${plural(cooks, 'cook')}, ${plural(DISHES, 'dish', 'different dishes')}`)
		).toBeInTheDocument();
	});

	test('the totals read in the singular for one', () => {
		const one = MONTHS.map((m, i) => ({ ...m, cooks: i === 0 ? 1 : 0 }));
		renderSummary({ months: one, dishes: 1 });
		expect(screen.getByText('1 cook, 1 dish')).toBeInTheDocument();
	});

	test('the year is printed on the first cell and where January starts a new one, nowhere else', () => {
		const { container } = renderSummary();
		const items = [...container.querySelectorAll('.jtwelve-months li')];
		const years = items.map((li) => li.querySelector('.jtwelve-year')?.textContent ?? null);
		expect(years).toEqual(
			MONTHS.map((m, i) => (i === 0 || m.month.slice(5, 7) === '01' ? m.month.slice(0, 4) : null))
		);
	});

	test('every cell prints its number, toned by its share of the busiest month', () => {
		const { container } = renderSummary();
		const most = Math.max(...COUNTS);
		const cells = [...container.querySelectorAll('.jtwelve-cell')];
		expect(cells.map((c) => c.textContent?.trim())).toEqual(COUNTS.map(String));
		expect(cells.map((c) => c.getAttribute('data-tone'))).toEqual(
			COUNTS.map((n) => String(monthTone(n, most)))
		);
	});

	test('the most cooked, linked when the cook may open the recipe, plain text when not, with its count', () => {
		renderSummary();
		const list = screen.getByRole('list', { name: TOP_HEADING });
		const rows = within(list).getAllByRole('listitem');
		expect(rows.map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual(
			TOP.map((t) => `${t.title} ${plural(t.times, 'time')}`)
		);
		expect(within(rows[0]).getByRole('link', { name: TOP[0].title })).toHaveAttribute(
			'href',
			TOP[0].href
		);
		expect(within(rows[1]).queryByRole('link')).toBeNull();
	});

	test('a window cooked only from links and improvisation shows the months alone', () => {
		renderSummary({ top: [] });
		expect(screen.queryByRole('heading', { name: TOP_HEADING })).toBeNull();
		expect(screen.getByRole('list', { name: HEADING })).toBeInTheDocument();
	});
});
