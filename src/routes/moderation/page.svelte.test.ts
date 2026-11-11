import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import Page from './+page.svelte';
import { dayLabel } from '#lib/journal.js';
import { plural } from '#lib/helpers.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const DAY = new Date('2026-11-10T00:00:00Z');
const recipes = [
	{
		slug: 'soup',
		title: 'Soup',
		author: 'cook',
		hidden: false,
		reports: [
			{ reason: 'Not a recipe', reportedAt: DAY, reporter: null },
			{ reason: 'Copied', reportedAt: DAY, reporter: 'priya' }
		]
	},
	{ slug: 'stew', title: 'Stew', author: 'cook', hidden: true, reports: [] }
];
const renderPage = (list = recipes) =>
	render(Page, { props: { data: { recipes: list, meta: { title: 'Moderation' } } as never } });

describe('/moderation', () => {
	test('each recipe links to itself, names its author and how many reports, and lists them', () => {
		renderPage();
		const [soup, stew] = screen.getAllByRole('listitem').filter((li) => li.matches('.list-row'));
		expect(within(soup).getByRole('link', { name: 'Soup' })).toHaveAttribute(
			'href',
			'/recipes/soup'
		);
		expect(within(soup).getByRole('link', { name: '@cook' })).toHaveAttribute(
			'href',
			'/users/cook'
		);
		expect(soup.textContent).toContain(plural(2, 'report'));
		expect(soup.textContent).toContain(`Not a recipe`);
		// The separators are drawn by CSS, never typed.
		const spans = (li: Element) =>
			[...li.querySelectorAll('.dot-list > span')].map((el) => el.textContent?.trim());
		const [anonymous] = soup.querySelectorAll('.reports > li');
		expect(spans(anonymous)).toEqual(['Anonymous', dayLabel(DAY)]);
		expect(within(soup).getByRole('link', { name: '@priya' })).toBeTruthy();
		expect(soup.textContent).not.toContain('null');
		expect(within(soup).getByRole('button', { name: 'Hide from others' })).toBeTruthy();
		expect(stew.textContent).toContain('Hidden');
		expect(stew.textContent).toContain(plural(0, 'report'));
		expect(within(stew).getByRole('button', { name: 'Restore Stew for other cooks' })).toBeTruthy();
	});

	test('with nothing reported or hidden, it says so', () => {
		renderPage([]);
		expect(screen.getByRole('heading', { name: 'Nothing to review' })).toBeTruthy();
	});
});
