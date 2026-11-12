import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeRow from './RecipeRow.svelte';
import source from './RecipeRow.svelte?raw';
import { dayLabel } from '#lib/journal.js';
import { cssRule } from '#lib/testing/css.js';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: () => {} }));

// The Cookbook's card data, as the list view gets it.
function makeRecipe(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		slug: 'chocolate-cake-abc123',
		title: 'Chocolate Cake',
		description: 'Not shown.',
		imageUrl: null,
		parentId: null,
		prepTimeMinutes: 20,
		cookTimeMinutes: 45,
		visibility: 'public' as const,
		author: { id: 'u1', username: 'devcooks' },
		versionCount: 1,
		forkCount: 0,
		...overrides
	};
}

const row = (overrides: Record<string, unknown> = {}, recipe: Record<string, unknown> = {}) =>
	render(RecipeRow, { props: { recipe: makeRecipe(recipe), ...overrides } as never });

/** The meta line's items, as read. */
const metaOf = (container: HTMLElement) =>
	[...container.querySelectorAll('.row-meta > *')].map((el) =>
		el.textContent!.replace(/\s+/g, ' ').trim()
	);

describe('RecipeRow', () => {
	test('is a list item whose link is the title, in a heading', () => {
		const { container } = row();
		expect(container.firstElementChild?.tagName).toBe('LI');
		const link = screen.getByRole('link', { name: 'Chocolate Cake' });
		expect(link).toHaveAttribute('href', '/recipes/chocolate-cake-abc123');
		expect(link.closest('h3')).not.toBeNull();
	});

	test('a long title wraps on as many lines as it needs, never clipped', () => {
		const rule = cssRule(source, '.row-title');
		expect(rule).not.toMatch(/line-clamp|nowrap|ellipsis/);
		expect(rule).toMatch(/overflow-wrap:\s*anywhere/);
	});

	test('the photo is a thumbnail with an empty alt; without one, the tint tile', () => {
		const { container, unmount } = row({}, { imageUrl: 'https://img/cake.jpg' });
		const img = container.querySelector('.row-thumb img');
		expect(img).toHaveAttribute('src', 'https://img/cake.jpg');
		expect(img).toHaveAttribute('alt', '');
		expect(img).toHaveAttribute('loading', 'lazy');
		unmount();
		const bare = row();
		expect(bare.container.querySelector('.row-thumb')).not.toBeNull();
		expect(bare.container.querySelector('.row-thumb img')).toBeNull();
		expect(cssRule(source, '.row-thumb')).toMatch(/background:\s*var\(--color-tint\)/);
	});

	test('the meta line: whose it is, the audience if not public, the times, the mark from v2', () => {
		const { container } = row({ saved: true }, { visibility: 'friends', versionCount: 3 });
		expect(metaOf(container)).toEqual([
			'Saved from @devcooks',
			'Friends',
			'20 min prep',
			'45 min cook',
			'v3'
		]);
		expect(screen.getByRole('link', { name: '@devcooks' })).toHaveAttribute(
			'href',
			'/users/devcooks'
		);
	});

	test('an own public v1 recipe says only its times, and never its description', () => {
		const { container } = row();
		expect(metaOf(container)).toEqual(['20 min prep', '45 min cook']);
		expect(screen.queryByText('Not shown.')).toBeNull();
	});

	test('a kept copy and an erased author read as they do on the card', () => {
		const { container, unmount } = row({ saved: true, kept: true });
		expect(metaOf(container)[0]).toBe('No longer shared by @devcooks');
		unmount();
		const gone = row({ saved: true, kept: true }, { author: null });
		expect(metaOf(gone.container)[0]).toBe('No longer shared by its author');
		gone.unmount();
		const unkept = row({ saved: true }, { author: null });
		expect(metaOf(unkept.container)[0]).toBe('Saved from another cook');
	});

	test('the first three tags and the cook’s own cooked fact have columns of their own', () => {
		const last = '2026-11-08';
		const { container } = row(
			{},
			{ tags: ['baking', 'cookies', 'dessert'], timesCooked: 9, lastCookedOn: last }
		);
		expect(container.querySelector('.row-tags')).toHaveTextContent('baking, cookies, dessert');
		// The date's no-break spaces read as spaces in the matcher's normalised text.
		expect(container.querySelector('.row-cooked')).toHaveTextContent(
			`Cooked 9 times, last on ${dayLabel(last)}`.replace(/\s/g, ' ')
		);
	});

	test('a recipe never cooked says so in its column', () => {
		const { container } = row();
		expect(container.querySelector('.row-cooked')).toHaveTextContent('Not cooked yet');
	});

	test('on a phone the tags and the cooked fact fold into the meta line, their columns gone', () => {
		const { container } = row({}, { tags: ['soup'], timesCooked: 1, lastCookedOn: '2026-10-28' });
		expect(metaOf(container)).toEqual([
			'20 min prep',
			'45 min cook',
			'soup',
			`Cooked on ${dayLabel('2026-10-28')}`.replace(/\s/g, ' ')
		]);
		expect(container.querySelector('.row-meta > .fold-tags')).toHaveTextContent('soup');
		expect(container.querySelector('.row-meta > .fold-cooked')).toHaveTextContent(/^Cooked on/);
		// Folded items are hidden while their columns show: the tags from 1024,
		// the cooked fact from 700.
		const hidden = cssRule(
			source,
			'.row-meta > :global(.fold-tags),\n\t.row-meta > :global(.fold-cooked)'
		);
		expect(hidden).toMatch(/display:\s*none/);
		const tablet = source.slice(source.indexOf('@media (max-width: 1023px)'));
		expect(cssRule(tablet, '.row-tags')).toMatch(/display:\s*none/);
		expect(cssRule(tablet, '.row-meta > :global(.fold-tags)')).toMatch(/display:\s*inline/);
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		expect(cssRule(phone, '.row-tags,\n\t\t.row-cooked')).toMatch(/display:\s*none/);
		expect(cssRule(phone, '.row-meta > :global(.fold-cooked)')).toMatch(/display:\s*inline/);
	});

	describe('the ⋯', () => {
		beforeEach(() => {
			vi.stubGlobal(
				'fetch',
				vi.fn(() => new Promise(() => {}))
			);
		});

		async function rowsAfterOpening() {
			await fireEvent.click(
				screen.getByRole('button', { name: 'More actions for Chocolate Cake' })
			);
			const menu = screen.getByRole('menu', { name: 'More actions' });
			return [...menu.querySelectorAll('[role^="menuitem"]:not([aria-busy])')].map((r) =>
				r.textContent?.trim()
			);
		}

		test('ends the row, after the title link in Tab order', () => {
			row();
			const more = screen.getByRole('button', { name: 'More actions for Chocolate Cake' });
			expect(more).toHaveClass('more-button');
			const link = screen.getByRole('link', { name: 'Chocolate Cake' });
			expect(link.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		test('offers what the card’s does: the owner’s rows, a saved one’s, a kept copy’s', async () => {
			const own = row();
			expect(await rowsAfterOpening()).toEqual(
				expect.arrayContaining(['Add to Journal', 'Edit recipe', 'Move to Trash'])
			);
			own.unmount();
			const saved = row({ saved: true });
			expect(await rowsAfterOpening()).toContain('Fork');
			saved.unmount();
			row({ saved: true, kept: true });
			expect(await rowsAfterOpening()).toEqual(['Add to Journal', 'Remove from Cookbook']);
		});
	});
});

describe('RecipeRow in select mode', () => {
	const selecting = (checked: boolean, onchange = vi.fn()) => ({
		...row({ saved: true, select: { checked, onchange } }),
		onchange
	});

	test('the row is a checkbox named for the recipe, at its start, with no link and no ⋯', () => {
		const { container } = selecting(false);
		const box = screen.getByRole('checkbox', { name: 'Chocolate Cake' });
		expect(container.querySelector('li')!.firstElementChild).toBe(box.closest('label'));
		expect(screen.queryByRole('link', { name: 'Chocolate Cake' })).toBeNull();
		expect(screen.queryByRole('button', { name: /More actions/ })).toBeNull();
		expect(screen.getByRole('heading', { name: 'Chocolate Cake' })).toBeInTheDocument();
	});

	test('a press says the new state', async () => {
		const { onchange } = selecting(false);
		await fireEvent.click(screen.getByRole('checkbox'));
		expect(onchange).toHaveBeenCalledWith(true);
	});

	test('a chosen row reads checked, its meta line (the saver’s handle) inert', () => {
		selecting(true);
		expect(screen.getByRole('checkbox')).toBeChecked();
		expect(
			screen.getByRole('link', { name: /devcooks/ }).closest<HTMLElement>('.row-meta')!.inert
		).toBe(true);
	});

	test('a chosen row is tinted, marigold at its start; the tick column takes the ⋯’s place', () => {
		expect(cssRule(source, '.recipe-row:has(.row-select :checked)')).toMatch(
			/background:\s*var\(--color-marigold-tint\)/
		);
		expect(cssRule(source, '.recipe-row.selecting')).toMatch(
			/grid-template-columns:\s*28px 64px minmax\(0, 1fr\) 190px 250px/
		);
	});
});
