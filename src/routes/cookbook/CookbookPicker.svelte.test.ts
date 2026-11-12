import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookbookPicker from './CookbookPicker.svelte';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';
import { plural } from '#lib/helpers.js';

const { page, goto } = vi.hoisted(() => ({
	page: { url: new URL('http://localhost/cookbook') },
	goto: vi.fn(async () => {})
}));
vi.mock('$app/navigation', () => ({ goto, afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const WEEKNIGHT = { id: 3, name: 'Weeknight', count: 37 };
const BAKING_SHELF = { id: 8, name: 'Baking', count: 52 };
const TAGS = [
	{ id: 1, name: 'Baking', slug: 'baking' },
	{ id: 2, name: 'Vegetarian', slug: 'vegetarian' },
	{ id: 3, name: 'Quick', slug: 'quick' }
];

function makePicker(
	overrides: Partial<{
		collection: { id: number; name: string } | null;
		selectedTags: string[];
		total: number;
	}> = {}
) {
	return render(CookbookPicker, {
		props: {
			collections: [WEEKNIGHT, BAKING_SHELF],
			collection: null,
			allTags: TAGS,
			selectedTags: [],
			total: 12,
			...overrides
		}
	});
}

const trigger = (name: RegExp) => screen.getByRole('button', { name });
const findBox = () => screen.getByRole('searchbox', { name: 'Find a collection or tag' });
const menu = () => screen.getByRole('menu', { name: 'Collections and tags' });
const group = (name: string) => within(menu()).getByRole('group', { name });

beforeEach(() => {
	page.url = new URL('http://localhost/cookbook?filter=mine&q=dal&page=3');
	goto.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe('Cookbook picker', () => {
	test('at rest: Collections and Tags, closed; a chosen collection names its button', () => {
		const { unmount } = makePicker();
		expect(trigger(/^Collections$/)).toHaveAttribute('aria-expanded', 'false');
		expect(trigger(/^Tags$/)).toHaveAttribute('aria-expanded', 'false');
		expect(trigger(/^Collections$/)).toHaveClass('btn-ghost');
		expect(screen.queryByRole('menu')).toBeNull();
		unmount();

		makePicker({ collection: WEEKNIGHT });
		expect(trigger(/Weeknight/)).toHaveTextContent('Weeknight');
		expect(trigger(/Weeknight/)).toHaveAccessibleName('Collection: Weeknight');
	});

	test('Collections opens on its own group: All collections first, then each with its count; the find box focused on a desktop', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await tick();
		expect(trigger(/^Collections$/)).toHaveAttribute('aria-expanded', 'true');
		const panel = document.getElementById(trigger(/^Collections$/).getAttribute('aria-controls')!);
		expect(panel).toContainElement(menu());
		expect(findBox()).toHaveFocus();
		expect(findBox()).toHaveAttribute('placeholder', 'Find a collection or tag…');

		const rows = within(group('Collections')).getAllByRole('menuitemradio');
		expect(rows.map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'All collections',
			'Weeknight 37',
			'Baking 52'
		]);
		expect(rows[0]).toHaveAttribute('aria-checked', 'true');
		// The other params kept, the loaded place dropped.
		expect(rows[1]).toHaveAttribute('href', '?filter=mine&q=dal&collection=3');
		expect(within(menu()).queryByRole('group', { name: 'Tags' })).toBeNull();
	});

	test('Tags opens on the tags, ticked as chosen, each link adding or dropping itself', async () => {
		page.url = new URL('http://localhost/cookbook?tags=vegetarian&collection=3');
		makePicker({ collection: WEEKNIGHT, selectedTags: ['vegetarian'] });
		await fireEvent.click(trigger(/^Tags$/));
		const rows = within(group('Tags')).getAllByRole('menuitemcheckbox');
		expect(rows.map((r) => r.textContent?.trim())).toEqual(['Baking', 'Vegetarian', 'Quick']);
		expect(rows[1]).toHaveAttribute('aria-checked', 'true');
		expect(rows[0]).toHaveAttribute('aria-checked', 'false');
		expect(rows[0]).toHaveAttribute('href', '?tags=vegetarian%2Cbaking&collection=3');
		expect(rows[1]).toHaveAttribute('href', '?collection=3');
		expect(within(menu()).queryByRole('group', { name: 'Collections' })).toBeNull();
	});

	test('typing finds in both groups, the opened one first; a collection says what it replaces', async () => {
		makePicker({ collection: WEEKNIGHT });
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.input(findBox(), { target: { value: 'ba' } });
		const groups = within(menu()).getAllByRole('group');
		expect(groups.map((g) => g.getAttribute('aria-labelledby'))).toEqual([
			'picker-tags',
			'picker-collections'
		]);
		expect(within(group('Tags')).getAllByRole('menuitemcheckbox')).toHaveLength(1);
		const shelf = within(group('Collections')).getByRole('menuitemradio');
		expect(shelf).toHaveTextContent(/^Baking\s*52\s*Replaces Weeknight$/);
		expect(within(menu()).queryByRole('menuitemradio', { name: /All collections/ })).toBeNull();
	});

	test('while typing, a group with no match shows no heading', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.input(findBox(), { target: { value: 'week' } });
		expect(within(menu()).getAllByRole('group')).toHaveLength(1);
		expect(group('Collections')).toBeInTheDocument();
	});

	test('no match says so in one line', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.input(findBox(), { target: { value: 'bakng' } });
		expect(screen.getByText('No collection or tag called “bakng”.')).toBeInTheDocument();
	});

	test('a tag applies at once and the picker stays open for another', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.click(within(group('Tags')).getByRole('menuitemcheckbox', { name: 'Quick' }));
		expect(goto).toHaveBeenCalledExactlyOnceWith('?filter=mine&q=dal&tags=quick', {
			reset: false
		});
		await tick();
		expect(screen.getByRole('menu')).toBeInTheDocument();
	});

	test('a collection applies, the tags kept, and the picker closes with focus on its button', async () => {
		page.url = new URL('http://localhost/cookbook?tags=quick');
		makePicker({ selectedTags: ['quick'] });
		await fireEvent.click(trigger(/^Collections$/));
		await fireEvent.click(
			within(group('Collections')).getByRole('menuitemradio', { name: /^Baking/ })
		);
		expect(goto).toHaveBeenCalledExactlyOnceWith('?tags=quick&collection=8', { reset: false });
		await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
		expect(trigger(/^Collections$/)).toHaveFocus();
	});

	test('a modified click (a new tab) is the browser’s, not a navigation here', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.click(within(group('Tags')).getByRole('menuitemcheckbox', { name: 'Quick' }), {
			metaKey: true
		});
		expect(goto).not.toHaveBeenCalled();
	});

	test('Escape in the New collection box goes back to its row', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'New collection' }));
		await tick();
		await fireEvent.keyDown(screen.getByRole('textbox', { name: 'New collection' }), {
			key: 'Escape'
		});
		await tick();
		expect(screen.getByRole('menuitem', { name: 'New collection' })).toHaveFocus();
	});

	test('Space takes a row, as Enter does', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.keyDown(
			within(group('Tags')).getByRole('menuitemcheckbox', { name: 'Quick' }),
			{
				key: ' '
			}
		);
		expect(goto).toHaveBeenCalledOnce();
	});

	test('Escape closes it and hands focus back to the button that opened it', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.keyDown(findBox(), { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(trigger(/^Tags$/)).toHaveFocus();
	});

	test('the other button, pressed while open, turns the panel to its group rather than closing it', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await fireEvent.click(trigger(/^Tags$/));
		expect(group('Tags')).toBeInTheDocument();
		expect(within(menu()).queryByRole('group', { name: 'Collections' })).toBeNull();
	});

	test('on a phone the keyboard stays down: the first row takes focus, not the find box', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(max-width: 767px)' }));
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await tick();
		expect(screen.getByRole('menuitemradio', { name: 'All collections' })).toHaveFocus();
	});

	test('Show N recipes says the current count and closes the picker', async () => {
		const total = 7;
		makePicker({ total });
		await fireEvent.click(trigger(/^Tags$/));
		const show = screen.getByRole('button', { name: `Show ${plural(total, 'recipe')}` });
		expect(show).toHaveClass('btn-primary');
		await fireEvent.click(show);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(trigger(/^Tags$/)).toHaveFocus();
	});

	test('chosen tags are pills after the buttons, each a link that drops its tag', () => {
		page.url = new URL('http://localhost/cookbook?tags=vegetarian,quick&page=2');
		makePicker({ selectedTags: ['vegetarian', 'quick'] });
		const pills = screen.getAllByRole('link', { name: /^Remove / });
		expect(pills.map((p) => p.getAttribute('aria-label'))).toEqual([
			'Remove Vegetarian',
			'Remove Quick'
		]);
		expect(pills[0]).toHaveAttribute('href', '?tags=quick');
		expect(pills[1]).toHaveAttribute('href', '?tags=vegetarian');
	});

	test('New collection, at the foot of the collections, is named in place and posts to the Cookbook', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'New collection' });
		expect(box).toHaveFocus();
		expect(box).toHaveAttribute('maxlength', String(COLLECTION_NAME_MAX));
		expect(box.closest('form')).toHaveAttribute('action', '?/createCollection');
	});

	test('fifty of each: the lists scroll inside the panel', async () => {
		render(CookbookPicker, {
			props: {
				collections: Array.from({ length: 50 }, (_, i) => ({
					id: i,
					name: `Shelf ${i}`,
					count: i
				})),
				collection: null,
				allTags: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Tag ${i}`, slug: `t${i}` })),
				selectedTags: [],
				total: 3
			}
		});
		await fireEvent.click(trigger(/^Tags$/));
		expect(within(menu()).getAllByRole('menuitemcheckbox')).toHaveLength(50);
		expect(menu()).toHaveClass('picker-lists');
	});
});
