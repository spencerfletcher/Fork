import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { plural } from '#lib/helpers.js';
import { monthTone } from '#lib/journal.js';
import JournalYear from './JournalYear.svelte';

const MONTHS = [4, 0, 2, 8, ...Array(8).fill(null)];
const TOP = [
	{ recipeId: 1, times: 5, title: 'Miso Salmon', href: '/recipes/miso-salmon' },
	{ recipeId: 2, times: 1, title: 'Dish from a recipe now gone', href: null }
];
const makeYear = (overrides = {}) => ({ year: 2031, months: MONTHS, top: TOP, ...overrides });
const renderYear = (overrides = {}) =>
	render(JournalYear, { props: { year: makeYear(overrides) } });
const monthName = (m: number) =>
	new Date(Date.UTC(2031, m, 1)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });

describe('JournalYear', () => {
	test('the year’s twelve months, each read as its name and count, to come when null', () => {
		renderYear();
		expect(screen.getByRole('heading', { level: 2, name: '2031 so far' })).toBeInTheDocument();
		const months = within(screen.getByRole('list', { name: '2031 so far' })).getAllByRole(
			'listitem'
		);
		expect(months.map((m) => m.querySelector('.sr-only')?.textContent)).toEqual(
			MONTHS.map((n, m) => `${monthName(m)}: ${n === null ? 'to come' : plural(n, 'cook')}`)
		);
	});

	test('every cell prints its number, toned by its share of the busiest month', () => {
		const { container } = renderYear();
		const most = Math.max(...MONTHS.map((n) => n ?? 0));
		const cells = [...container.querySelectorAll('.jyear-cell')];
		expect(cells.map((c) => c.textContent?.trim())).toEqual(MONTHS.map((n) => String(n ?? '–')));
		expect(cells.map((c) => c.getAttribute('data-tone'))).toEqual(
			MONTHS.map((n) => String(monthTone(n, most)))
		);
	});

	test('the most cooked, linked when the cook may open the recipe, plain text when not, with its count', () => {
		renderYear();
		const list = screen.getByRole('list', { name: 'Most cooked this year' });
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

	test('a year cooked only from links and improvisation shows the months alone', () => {
		renderYear({ top: [] });
		expect(screen.queryByRole('heading', { name: 'Most cooked this year' })).toBeNull();
		expect(screen.getByRole('list', { name: '2031 so far' })).toBeInTheDocument();
	});
});
