import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { draftKey, saveDraft, type DraftRecipe } from '#lib/drafts.js';
import { draftOf } from '#lib/recipes/validation.js';
import CookbookPage from './+page.svelte';
import { COOKBOOK_FILTERS, COOKBOOK_VIEWS } from './filters.js';
import type { CardSort } from '#lib/listPage.js';
import source from './+page.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import type { SubmitFunction } from '$app/forms';

const style = source.slice(source.indexOf('<style>'));

const { page, goto, submits } = vi.hoisted(() => ({
	page: { url: new URL('http://localhost/cookbook') } as {
		url: URL;
		shallow?: { url: URL };
	},
	goto: vi.fn(),
	// Each form's enhance callback, so a test can play back an action's result.
	submits: new Map<HTMLFormElement, SubmitFunction>()
}));
vi.mock('$app/navigation', () => ({ goto, snapshot: vi.fn(), afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: SubmitFunction) => {
		submits.set(form, submit);
		return { destroy: () => {} };
	},
	// The test's fetch answers in JSON already.
	deserialize: (text: string) => JSON.parse(text)
}));

function makeRecipe(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		slug: 'dal',
		title: 'Weeknight Dal',
		description: null,
		imageUrl: null,
		parentId: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null,
		visibility: 'public',
		author: { id: 'me', username: 'me' },
		saved: false,
		...overrides
	};
}

const base = {
	recipes: [] as ReturnType<typeof makeRecipe>[],
	counts: { all: 0, mine: 0, saved: 0, trash: 0 },
	inView: { all: 0, mine: 0, saved: 0 },
	collections: [] as { id: number; name: string; count: number }[],
	collection: null as { id: number; name: string } | null,
	filter: 'all' as (typeof COOKBOOK_FILTERS)[number],
	view: 'grid' as (typeof COOKBOOK_VIEWS)[number],
	sort: 'newest' as CardSort,
	allTags: [],
	searchQuery: '',
	selectedTags: [] as string[]
};

/** One page, the whole list: the total is the cards given, and no page follows. */
const onePage = <D extends { recipes: unknown[] }>(data: D) => ({
	...data,
	total: data.recipes.length,
	next: null
});

function renderCookbook(overrides: Partial<typeof base> = {}) {
	return render(CookbookPage, { props: { data: onePage({ ...base, ...overrides }) } as never });
}

/** ResultStatus's count (the ⋯'s outcome is the page's other status). */
const resultStatus = () =>
	screen.getAllByRole('status').find((s) => s.getAttribute('aria-live') === 'polite')!;

const full = {
	recipes: [
		makeRecipe(),
		makeRecipe({
			id: 2,
			slug: 'poke',
			title: 'Poke',
			saved: true,
			author: { id: 's', username: 'samlind' }
		})
	],
	counts: { all: 9, mine: 6, saved: 3, trash: 0 },
	inView: { all: 9, mine: 6, saved: 3 },
	collections: [{ id: 4, name: 'Quick', count: 2 }]
};

beforeEach(() => {
	page.url = new URL('http://localhost/cookbook');
});

describe('Cookbook page', () => {
	test('an empty library: the copy, New recipe and the way to Discover; no search box', () => {
		renderCookbook();
		expect(screen.getByRole('heading', { level: 2, name: 'Your cookbook is empty' })).toBeVisible();
		expect(
			screen.getByText('Recipes you write and recipes you save from others live here.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute(
			'href',
			'/recipes/new'
		);
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveClass('btn-primary');
		expect(screen.getByRole('link', { name: 'Explore Discover →' })).toHaveAttribute(
			'href',
			'/discover'
		);
		expect(screen.queryByRole('searchbox')).toBeNull();
		expect(screen.queryByRole('img')).toBeNull();
	});

	test('the Trash link sits at the foot only while the Trash holds something, the empty cookbook included', () => {
		renderCookbook();
		expect(screen.queryByRole('link', { name: /Trash/ })).toBeNull();

		for (const data of [
			{ counts: { ...base.counts, trash: 2 } },
			{ ...full, counts: { ...full.counts, trash: 2 } }
		]) {
			const { unmount } = renderCookbook(data);
			const link = screen.getByRole('link', { name: 'Trash (2) →' });
			expect(link).toHaveAttribute('href', '/cookbook/trash');
			expect(link).toHaveClass('arrow-link');
			// Last on the page: after the grid or the empty panel.
			const links = screen.getAllByRole('link');
			expect(links[links.length - 1]).toBe(link);
			unmount();
		}
	});

	test('the count sentence says how many are yours and how many saved', () => {
		renderCookbook(full);
		expect(screen.getByText('9 recipes: 6 yours, 3 saved from other cooks.')).toBeInTheDocument();
	});

	test('one grid: own cards carry no owner line, saved cards say whose', () => {
		const { container } = renderCookbook(full);
		expect(container.querySelectorAll('.cookbook-grid .recipe-card')).toHaveLength(2);
		expect(screen.queryByText('@me')).toBeNull();
		expect(container.querySelector('.card-source')).toHaveTextContent('Saved from @samlind');
	});

	test('All · Mine · Saved, with counts, the current one marked', () => {
		renderCookbook({ ...full, filter: 'saved' });
		const group = screen.getByRole('group', { name: 'Show' });
		const links = [...group.querySelectorAll('a')];
		expect(links.map((a) => a.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'All 9',
			'Mine 6',
			'Saved 3'
		]);
		expect(links.find((a) => a.getAttribute('aria-current') === 'page')).toHaveTextContent('Saved');
	});

	test('inside a collection the segments count it, the line under the title the whole library', () => {
		renderCookbook({
			...full,
			collection: { id: 4, name: 'Quick' },
			inView: { all: 2, mine: 1, saved: 1 }
		});
		const group = screen.getByRole('group', { name: 'Show' });
		expect(group).toHaveTextContent(/All\s*2\s*Mine\s*1\s*Saved\s*1/);
		expect(screen.getByText(/^9 recipes: 6 yours, 3 saved/)).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: 'Quick' })).toBeInTheDocument();
	});

	test('an empty collection says how to fill it, with no filters over it', () => {
		renderCookbook({
			...full,
			recipes: [],
			collection: { id: 4, name: 'Quick' },
			inView: { all: 0, mine: 0, saved: 0 }
		});
		expect(screen.getByRole('heading', { level: 2, name: 'Nothing in Quick yet' })).toBeVisible();
		expect(
			screen.getByText('Open a recipe from your Cookbook and choose this collection in its ⋯ menu.')
		).toBeInTheDocument();
		expect(screen.queryByRole('searchbox')).toBeNull();
		expect(screen.getByRole('navigation', { name: 'Collections' })).toBeInTheDocument();
	});

	test('the collections sit over the filters, not over an empty cookbook', () => {
		const { unmount } = renderCookbook(full);
		const nav = screen.getByRole('navigation', { name: 'Collections' });
		expect(
			nav.compareDocumentPosition(screen.getByRole('group', { name: 'Show' })) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		unmount();
		renderCookbook({ collections: full.collections });
		expect(screen.queryByRole('navigation', { name: 'Collections' })).toBeNull();
	});

	test('the filter links keep the search and the tags', () => {
		page.url = new URL('http://localhost/cookbook?q=dal&tags=baking&filter=mine');
		renderCookbook({ ...full, filter: 'mine', searchQuery: 'dal', selectedTags: ['baking'] });
		const href = (name: string) =>
			within(screen.getByRole('group', { name: 'Show' }))
				.getByRole('link', { name: new RegExp(`^${name}`) })
				.getAttribute('href');
		expect(href('Saved')).toBe('?q=dal&tags=baking&filter=saved');
		expect(href('All')).toBe('?q=dal&tags=baking');
	});

	test('a filter link starts the list at its first page', () => {
		page.url = new URL('http://localhost/cookbook?q=dal&filter=mine&page=3');
		renderCookbook({ ...full, filter: 'mine', searchQuery: 'dal' });
		const saved = within(screen.getByRole('group', { name: 'Show' })).getByRole('link', {
			name: /^Saved/
		});
		expect(saved).toHaveAttribute('href', '?q=dal&filter=saved');
	});

	test('Sort sits in the filter row with Grid | List, showing the page’s order; a search disables it', () => {
		const { container, unmount } = renderCookbook({ ...full, sort: 'cooked' });
		const sort = screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement;
		expect(sort.value).toBe('cooked');
		expect(sort.closest('.cookbook-view')).toBe(
			screen.getByRole('group', { name: 'View' }).closest('.cookbook-view')
		);
		expect(container.querySelector('.cookbook-filters .cookbook-view')).not.toBeNull();
		unmount();
		renderCookbook({ ...full, sort: 'cooked', searchQuery: 'dal' });
		expect(screen.getByRole('combobox', { name: 'Sort' })).toBeDisabled();
	});

	describe('Grid | List', () => {
		const viewLinks = () =>
			within(screen.getByRole('group', { name: 'View' })).getAllByRole('link');

		test('two links drawn as the segments, the current one marked, Grid by default', () => {
			renderCookbook(full);
			const links = viewLinks();
			expect(links.map((a) => a.textContent?.trim())).toEqual(['Grid', 'List']);
			expect(links[0]).toHaveAttribute('aria-current', 'page');
			expect(links[1]).not.toHaveAttribute('aria-current');
			expect(links[0].closest('.seg')).toBe(screen.getByRole('group', { name: 'View' }));
			// Icons beside the words are decoration, centred by the row.
			expect(links[0].querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
		});

		test('each keeps the filters and drops the place, naming its view either way', () => {
			page.url = new URL('http://localhost/cookbook?filter=mine&q=dal&page=3');
			renderCookbook({ ...full, filter: 'mine', searchQuery: 'dal', view: 'list' });
			const [grid, list] = viewLinks();
			// Grid is named too: the device may remember List, and the URL wins.
			expect(grid).toHaveAttribute('href', '?filter=mine&q=dal&view=grid');
			expect(list).toHaveAttribute('href', '?filter=mine&q=dal&view=list');
			expect(list).toHaveAttribute('aria-current', 'page');
		});

		test('List shows the shared rows, one per recipe, with no grid', () => {
			const { container } = renderCookbook({ ...full, view: 'list' });
			const rows = within(screen.getByRole('list', { name: 'Recipes' })).getAllByRole('listitem');
			expect(rows).toHaveLength(2);
			expect(container.querySelector('ul.row-list')).not.toBeNull();
			expect(container.querySelector('.cookbook-grid')).toBeNull();
			expect(within(rows[1]).getByText(/Saved from/)).toHaveTextContent('Saved from @samlind');
			expect(within(rows[0]).getByRole('link', { name: 'Weeknight Dal' })).toHaveAttribute(
				'href',
				'/recipes/dal'
			);
		});
	});

	test('a filter that empties the grid keeps the filters and tells a screen reader 0 recipes match', () => {
		renderCookbook({ ...full, recipes: [], searchQuery: 'saffron' });
		expect(screen.getByRole('searchbox')).toHaveValue('saffron');
		expect(resultStatus()).toHaveTextContent('0 recipes match');
		expect(resultStatus()).toHaveClass('sr-only');
		expect(screen.getByRole('heading', { name: 'No recipes match “saffron”.' })).toBeVisible();
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute('href', '/cookbook');
	});

	test('a filter with matches announces the count to screen readers only', () => {
		renderCookbook({ ...full, selectedTags: ['baking'] });
		const status = resultStatus();
		expect(status).toHaveTextContent(`${full.recipes.length} recipe`);
		expect(status).toHaveClass('sr-only');
		expect(status).toHaveAttribute('aria-live', 'polite');
	});

	test('the status stays quiet over the unfiltered library', () => {
		renderCookbook(full);
		expect(resultStatus()).toHaveTextContent('');
	});

	test('New recipe sits in the header over a full library', () => {
		renderCookbook(full);
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveClass('btn-primary');
	});

	// Beside the title on a phone it is one line at the small size, 44px tall;
	// the subtitle wraps under the title instead.
	test('the header New recipe is the small button on one line', () => {
		renderCookbook(full);
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveClass('btn-sm');
		expect(cssRule(style, '.cookbook-new')).toMatch(/white-space:\s*nowrap/);
	});

	// Under 700 three rows: the title, the count at full width, then New recipe
	// across the page (Spencer, 11 November 2026).
	test('under 700 the header stacks and New recipe runs full width', () => {
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
		expect(style).toContain('@media (max-width: 699px)');
		expect(cssRule(phone, '.cookbook-head')).toMatch(/flex-direction:\s*column/);
		expect(cssRule(phone, '.cookbook-head')).toMatch(/align-items:\s*stretch/);
		expect(cssRule(phone, '.cookbook-new')).toMatch(/width:\s*100%/);
	});
});

describe('Cookbook: a card’s ⋯ takes the recipe out of the library', () => {
	beforeEach(() => {
		goto.mockReset();
		page.shallow = undefined;
		submits.clear();
		// The collections are asked for on open; unanswered, they do not matter here.
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise(() => {}))
		);
	});

	/** Opens `title`'s ⋯, presses `row`, confirms, and plays the action's redirect back. */
	async function takeOut(title: string, row: string) {
		await fireEvent.click(screen.getByRole('button', { name: `More actions for ${title}` }));
		await fireEvent.click(screen.getByRole('menuitem', { name: row }));
		await tick();
		const form = screen.getByRole('group', { name: new RegExp(title) }).closest('form')!;
		const after = await submits.get(form)!({
			action: new URL(form.action),
			formElement: form,
			formData: new FormData(form),
			controller: new AbortController(),
			submitter: null,
			cancel: () => {}
		} as never);
		await after?.({
			result: { type: 'redirect', status: 303, location: '/cookbook/trash' },
			update: vi.fn()
		} as never);
		await tick();
	}

	test('Move to Trash reloads the page at its own URL, place and all, says so with the Trash link, and focuses the card in its place', async () => {
		// Show more wrote ?page=2 by a shallow replace, which page.url does not follow.
		page.url = new URL('http://localhost/cookbook?filter=mine');
		page.shallow = { url: new URL('http://localhost/cookbook?filter=mine&page=2') };
		const [dal, poke] = full.recipes;
		const { rerender } = renderCookbook(full);
		goto.mockImplementation(() =>
			rerender({ data: onePage({ ...base, ...full, recipes: [poke] }) } as never)
		);

		await takeOut(dal.title, 'Move to Trash');

		// Scroll and focus left alone (reset: false); every load runs again.
		expect(goto).toHaveBeenCalledExactlyOnceWith(page.shallow.url.href, {
			replace: true,
			reset: false,
			refreshAll: true
		});
		const status = screen.getByText(/to your/).closest('[role="status"]') as HTMLElement;
		expect(status).toHaveTextContent(`Moved ${dal.title} to your Trash.`);
		expect(within(status).getByRole('link', { name: 'Open Trash' })).toHaveAttribute(
			'href',
			'/cookbook/trash'
		);
		await vi.waitFor(() => expect(screen.getByRole('link', { name: poke.title })).toHaveFocus());
	});

	test('in the list view a row’s ⋯ does the same: the page reloads in place and the next row takes focus', async () => {
		page.url = new URL('http://localhost/cookbook?view=list');
		const [dal, poke] = full.recipes;
		const listed = { ...full, view: 'list' as const };
		const { rerender } = renderCookbook(listed);
		goto.mockImplementation(() =>
			rerender({ data: onePage({ ...base, ...listed, recipes: [poke] }) } as never)
		);

		await takeOut(dal.title, 'Move to Trash');

		expect(goto).toHaveBeenCalledExactlyOnceWith(page.url.href, {
			replace: true,
			reset: false,
			refreshAll: true
		});
		expect(screen.getByText(`Moved ${dal.title} to your Trash.`)).toBeInTheDocument();
		await vi.waitFor(() => expect(screen.getByRole('link', { name: poke.title })).toHaveFocus());
	});

	test('a kept copy’s Remove from Cookbook says it went; the last card hands focus to the title', async () => {
		const copy = makeRecipe({ title: 'Old Soup', saved: true, kept: true });
		const { rerender } = renderCookbook({ ...full, recipes: [copy] });
		goto.mockImplementation(() =>
			rerender({ data: onePage({ ...base, ...full, recipes: [] }) } as never)
		);

		await takeOut(copy.title, 'Remove from Cookbook');

		expect(goto).toHaveBeenCalledOnce();
		expect(goto.mock.calls[0][0]).toBe(page.url.href);
		expect(screen.getByText('Removed your copy of Old Soup.')).toBeInTheDocument();
		await vi.waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
	});
});

describe('Cookbook: a card’s ⋯ changes a collection', () => {
	const TO_COOK = { id: 5, name: 'To cook', count: 2 };

	beforeEach(() => {
		goto.mockReset();
		page.url = new URL('http://localhost/cookbook?collection=5');
		page.shallow = { url: new URL('http://localhost/cookbook?collection=5&page=2') };
		submits.clear();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				text: async () =>
					JSON.stringify({
						type: 'success',
						data: { collections: [{ ...TO_COOK, has: true }] }
					})
			}))
		);
	});

	/** Opens `title`'s ⋯ and plays a successful press of To cook back. */
	async function untick(title: string) {
		await fireEvent.click(screen.getByRole('button', { name: `More actions for ${title}` }));
		const row = await screen.findByRole('menuitemcheckbox', { name: 'To cook' });
		const form = row.closest('form')!;
		const after = await submits.get(form)!({
			action: new URL(form.action),
			formElement: form,
			formData: new FormData(form),
			controller: new AbortController(),
			submitter: null,
			cancel: () => {}
		} as never);
		await after?.({ result: { type: 'success', data: {} }, update: vi.fn() } as never);
		await tick();
	}

	test('the page reloads in place, place and all, so the strip’s counts follow; a card still here keeps its menu', async () => {
		const [dal] = full.recipes;
		const { rerender } = renderCookbook({ ...full, collection: TO_COOK });
		goto.mockImplementation(() =>
			rerender({
				data: onePage({ ...base, ...full, collection: TO_COOK, collections: [TO_COOK] })
			} as never)
		);
		await untick(dal.title);
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledExactlyOnceWith(page.shallow!.url.href, {
				replace: true,
				reset: false,
				refreshAll: true
			})
		);
		expect(screen.getByRole('menu', { name: 'More actions' })).toBeInTheDocument();
		expect(screen.queryByText(/Removed .* from/)).toBeNull();
	});

	test('a card unticked from the collection being viewed goes, says so, and focus takes its place', async () => {
		const [dal, poke] = full.recipes;
		const { rerender } = renderCookbook({ ...full, collection: TO_COOK });
		goto.mockImplementation(() =>
			rerender({
				data: onePage({ ...base, ...full, collection: TO_COOK, recipes: [poke] })
			} as never)
		);
		await untick(dal.title);
		await vi.waitFor(() =>
			expect(screen.getByText(`Removed ${dal.title} from To cook.`)).toBeInTheDocument()
		);
		expect(
			screen.getByText(`Removed ${dal.title} from To cook.`).closest('[role="status"]')
		).not.toBeNull();
		await vi.waitFor(() => expect(screen.getByRole('link', { name: poke.title })).toHaveFocus());
	});
});

describe('Cookbook drafts on this device', () => {
	const USER = 'me';
	const signedIn = (overrides: Partial<typeof base> = {}) =>
		render(CookbookPage, {
			props: { data: onePage({ ...base, ...full, ...overrides, user: { id: USER } }) } as never
		});
	const MINUTE = 60 * 1000;
	const seed = (recipe: string, title: string, ago: number, linked?: DraftRecipe) => {
		const form = new FormData();
		form.set('title', title);
		saveDraft(draftKey(USER, recipe), {
			draft: draftOf(form),
			savedAt: Date.now() - ago,
			photoLost: false,
			...(linked ? { recipe: linked } : {})
		});
	};
	const drafts = () => screen.getByRole('region', { name: 'Drafts' });

	beforeEach(() => localStorage.clear());

	test('nothing on the device, no Drafts section', () => {
		signedIn();
		expect(screen.queryByRole('region', { name: 'Drafts' })).toBeNull();
	});

	test('one row per draft, newest first: its title, what it is, its age, Continue to its editor', async () => {
		seed('new', '', 5 * MINUTE);
		seed('7', 'Chewy cookies', MINUTE, { slug: 'cookies', title: 'Cookies' });
		signedIn();
		await tick();
		expect(within(drafts()).getByRole('heading', { level: 2, name: 'Drafts' })).toBeVisible();
		expect(within(drafts()).getByText('Kept on this device only.')).toBeInTheDocument();
		const rows = within(drafts()).getAllByRole('listitem');
		expect(rows.map((r) => r.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'Chewy cookies Changes to Cookies edited 1 minute ago Continue Discard',
			'Untitled recipe New recipe edited 5 minutes ago Continue Discard'
		]);
		expect(within(rows[0]).getByRole('link', { name: 'Continue Chewy cookies' })).toHaveAttribute(
			'href',
			'/recipes/cookies/edit'
		);
		expect(within(rows[1]).getByRole('link', { name: 'Continue Untitled recipe' })).toHaveAttribute(
			'href',
			'/recipes/new'
		);
	});

	test('another cook’s drafts on the device are not listed', async () => {
		saveDraft(draftKey('someone-else', 'new'), {
			draft: draftOf(new FormData()),
			savedAt: Date.now(),
			photoLost: false
		});
		signedIn();
		await tick();
		expect(screen.queryByRole('region', { name: 'Drafts' })).toBeNull();
	});

	test('Discard removes the draft from the device in place; the last one takes the section with it', async () => {
		seed('new', 'Soup', MINUTE);
		seed('7', 'Chewy cookies', 2 * MINUTE, { slug: 'cookies', title: 'Cookies' });
		signedIn();
		await tick();
		await fireEvent.click(within(drafts()).getByRole('button', { name: 'Discard Soup' }));
		expect(localStorage.getItem(draftKey(USER, 'new'))).toBeNull();
		expect(within(drafts()).getAllByRole('listitem')).toHaveLength(1);
		expect(within(drafts()).getByRole('link', { name: 'Continue Chewy cookies' })).toHaveFocus();
		await fireEvent.click(within(drafts()).getByRole('button', { name: 'Discard Chewy cookies' }));
		expect(screen.queryByRole('region', { name: 'Drafts' })).toBeNull();
		expect(screen.getByRole('heading', { level: 1, name: 'Cookbook' })).toHaveFocus();
	});

	test('shows on an empty Cookbook too', async () => {
		seed('new', 'Soup', MINUTE);
		signedIn({ recipes: [], counts: { all: 0, mine: 0, saved: 0, trash: 0 } });
		await tick();
		expect(within(drafts()).getByText('Soup')).toBeInTheDocument();
		expect(screen.getByText('Your cookbook is empty')).toBeInTheDocument();
	});

	test('the rows are the shared list rows, Continue and Discard text buttons', async () => {
		seed('new', 'Soup', MINUTE);
		signedIn();
		await tick();
		expect(within(drafts()).getByRole('listitem')).toHaveClass('list-row');
		expect(within(drafts()).getByRole('link', { name: 'Continue Soup' })).toHaveClass('text-btn');
		expect(within(drafts()).getByRole('button', { name: 'Discard Soup' })).toHaveClass('text-btn');
	});
});
