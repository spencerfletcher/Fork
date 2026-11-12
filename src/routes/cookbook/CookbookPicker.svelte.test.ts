import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookbookPicker from './CookbookPicker.svelte';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';
import { plural } from '#lib/helpers.js';
import { cssRule } from '#lib/testing/css.js';
import source from './CookbookPicker.svelte?raw';
import tabBarSource from '#lib/components/ui/TabBar.svelte?raw';
import navbarSource from '#lib/components/ui/Navbar.svelte?raw';

const { page, goto } = vi.hoisted(() => ({
	page: { url: new URL('http://localhost/cookbook') },
	goto: vi.fn(async () => {})
}));
vi.mock('$app/navigation', () => ({ goto, afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// The tab bar's layer, read from its own style.
const TAB_BAR_Z = Number(cssRule(tabBarSource, '.tab-bar').match(/z-index:\s*(\d+)/)?.[1]);
// The top bar's layer, its Tailwind class.
const NAV_Z = Number(navbarSource.match(/<nav class="[^"]*\bz-(\d+)/)?.[1]);

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

	test('while typing, a polite status says how many of each the find box left', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		const status = screen.getByRole('status');
		expect(status).toHaveTextContent(/^$/);
		await fireEvent.input(findBox(), { target: { value: 'ba' } });
		expect(status).toHaveTextContent(`${plural(1, 'collection')}, ${plural(1, 'tag')}`);
		await fireEvent.input(findBox(), { target: { value: 'bakng' } });
		expect(status).toHaveTextContent(`${plural(0, 'collection')}, ${plural(0, 'tag')}`);
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
		// The band marks the button whose group shows, not both.
		expect(trigger(/^Tags$/)).toHaveClass('showing');
		expect(trigger(/^Collections$/)).not.toHaveClass('showing');
	});

	test('turned to the other group, Escape hands focus back to the button that turned it', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		await fireEvent.click(trigger(/^Tags$/));
		await fireEvent.keyDown(findBox(), { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(trigger(/^Tags$/)).toHaveFocus();
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

	// Owner, 12 November 2026: "phone sheet dim backdrop": the page under the
	// sheet reads as inactive, the tab bar under it too, and a press on it closes.
	test('the sheet has a backdrop, hidden from assistive tech, that closes the picker when pressed', async () => {
		const { container } = makePicker();
		await fireEvent.click(trigger(/^Tags$/));
		const scrim = container.querySelector('.picker-scrim')!;
		expect(scrim).toHaveAttribute('aria-hidden', 'true');
		await fireEvent.click(scrim);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(trigger(/^Tags$/)).toHaveFocus();
	});

	test('the backdrop is a phone’s, over the tab bar and the top bar, under the sheet', () => {
		const phone = source.slice(source.indexOf('@media (max-width: 767px)'));
		expect(cssRule(source, '.picker-scrim')).toMatch(/display:\s*none/);
		const rule = cssRule(phone, '.picker-scrim');
		expect(rule).toMatch(/display:\s*block/);
		expect(rule).toMatch(/position:\s*fixed/);
		const z = (css: string) => Number(css.match(/z-index:\s*(\d+)/)?.[1]);
		const sheet = cssRule(phone, '.picker :global(.menu-panel.picker-panel)');
		expect(z(rule)).toBeGreaterThan(TAB_BAR_Z);
		expect(z(rule)).toBeGreaterThanOrEqual(NAV_Z);
		expect(z(rule)).toBeLessThan(z(sheet));
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

	// Owner, 12 November 2026: "drop the heading"; Rename and Delete live in
	// the picker, under the chosen collection's row.
	test('the chosen collection carries Rename and Delete under its row; none other does', async () => {
		makePicker({ collection: WEEKNIGHT });
		await fireEvent.click(trigger(/^Collection: Weeknight$/));
		const rows = [...group('Collections').querySelectorAll('[role^="menuitem"]')];
		const names = rows.map((r) => r.getAttribute('aria-label') ?? r.textContent!.trim());
		const at = names.findIndex((n) => n.startsWith('Weeknight'));
		expect(names.slice(at + 1, at + 3)).toEqual(['Rename Weeknight', 'Delete collection']);
		expect(screen.getAllByRole('menuitem', { name: /^Rename/ })).toHaveLength(1);
	});

	test('no collection chosen, or typing, there is no Rename or Delete', async () => {
		makePicker();
		await fireEvent.click(trigger(/^Collections$/));
		expect(screen.queryByRole('menuitem', { name: /^Rename/ })).toBeNull();
		expect(screen.queryByRole('menuitem', { name: 'Delete collection' })).toBeNull();
	});

	test('Rename edits the name in place, posts the collection’s id, and Escape goes back to it', async () => {
		makePicker({ collection: WEEKNIGHT });
		await fireEvent.click(trigger(/^Collection: Weeknight$/));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Weeknight' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'Collection name' });
		expect(box).toHaveValue('Weeknight');
		expect(box).toHaveFocus();
		expect(box).toHaveAttribute('maxlength', String(COLLECTION_NAME_MAX));
		const form = box.closest('form')!;
		expect(form).toHaveAttribute('action', '?/renameCollection');
		expect(form.querySelector('input[name="id"]')).toHaveValue('3');

		await fireEvent.keyDown(box, { key: 'Escape' });
		await tick();
		expect(screen.getByRole('menuitem', { name: 'Rename Weeknight' })).toHaveFocus();
		expect(menu()).toBeInTheDocument();
	});

	test('Delete is asked twice, saying the recipes stay', async () => {
		makePicker({ collection: WEEKNIGHT });
		await fireEvent.click(trigger(/^Collection: Weeknight$/));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Delete collection' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Delete Weeknight?' });
		expect(step).toHaveAccessibleDescription(
			'Only the collection goes; its recipes stay in your Cookbook.'
		);
		const form = within(step).getByRole('button', { name: 'Delete collection' }).closest('form')!;
		expect(form).toHaveAttribute('action', '?/deleteCollection');
		expect(form.querySelector('input[name="id"]')).toHaveValue('3');
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
