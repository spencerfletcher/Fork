import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import Discover from './Discover.svelte';
import source from './Discover.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/discover') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), snapshot: vi.fn() }));
vi.mock('$app/state', () => ({ page }));

function makeCard(id: number, overrides: Record<string, unknown> = {}) {
	return {
		id,
		slug: `r-${id}`,
		title: `Recipe ${id}`,
		description: null,
		imageUrl: null,
		parentId: null,
		servings: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null,
		visibility: 'public',
		author: { id: `a${id}`, username: `cook${id}` },
		versionCount: 1,
		forkCount: 0,
		...overrides
	};
}

const base = {
	lead: null as ReturnType<typeof makeCard> | null,
	recentChanges: [] as unknown[],
	recipes: [] as ReturnType<typeof makeCard>[],
	allTags: [],
	searchQuery: '',
	selectedTags: [] as string[],
	friendsOnly: undefined as boolean | undefined
};

/** One page, the whole list: the total is the cards given, and no page follows. */
const renderDiscover = (overrides: Partial<typeof base> = {}) => {
	const data = { ...base, ...overrides };
	return render(Discover, {
		props: { data: { ...data, total: data.recipes.length, next: null } } as never
	});
};

describe('Discover', () => {
	test('the heading and the lede', () => {
		renderDiscover();
		expect(screen.getByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
		expect(screen.getByText('Recipes from every cook on Fork.')).toBeInTheDocument();
	});

	test('the lead card leads, linking to its recipe, with the cook and the measure', () => {
		renderDiscover({
			lead: makeCard(9, {
				title: 'Cardamom Buns',
				prepTimeMinutes: 45,
				cookTimeMinutes: 25,
				servings: 12,
				versionCount: 3
			}),
			recipes: [makeCard(1)]
		});
		const link = screen.getByRole('link', { name: 'Cardamom Buns' });
		expect(link).toHaveAttribute('href', '/recipes/r-9');
		const lead = link.closest<HTMLElement>('.lead')!;
		expect(within(lead).getByText('@cook9')).toBeInTheDocument();
		expect(within(lead).getByText('45 min prep')).toBeInTheDocument();
		expect(within(lead).getByText('25 min cook')).toBeInTheDocument();
		expect(within(lead).queryByText('1 h 10 min')).toBeNull();
		expect(within(lead).getByText('Serves 12')).toBeInTheDocument();
		expect(within(lead).getByText('v3')).toBeInTheDocument();
		expect(within(lead).queryByText(/Open recipe/)).toBeNull();
	});

	test('the lead cook is one profile link, ahead of the recipe link, neither inside the other', () => {
		renderDiscover({ lead: makeCard(9, { title: 'Cardamom Buns' }) });
		const lead = screen.getByRole('link', { name: 'Cardamom Buns' }).closest<HTMLElement>('.lead')!;
		const profile = within(lead).getByRole('link', { name: '@cook9' });
		expect(profile).toHaveAttribute('href', '/users/cook9');
		expect(profile.querySelector('.avatar')).not.toBeNull();
		expect([...lead.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/users/cook9',
			'/recipes/r-9'
		]);
		expect(lead.querySelector('a a')).toBeNull();
	});

	test('while filtering, the lead and Recent changes stay', () => {
		renderDiscover({
			searchQuery: 'dal',
			lead: makeCard(9, { title: 'Dal' }),
			recentChanges: [
				{
					versionNumber: 2,
					commitMessage: 'More cumin',
					slug: 'dal',
					title: 'Dal',
					username: 'maria',
					href: '/recipes/dal/diff?from=1&to=2'
				}
			]
		});
		expect(screen.getByRole('link', { name: 'Dal' })).toHaveAttribute('href', '/recipes/r-9');
		expect(screen.getByRole('heading', { name: 'Recent changes' })).toBeInTheDocument();
	});

	test('Recent changes: each small card names the version, recipe, cook and note, and opens its diff', () => {
		renderDiscover({
			lead: makeCard(9),
			recentChanges: [
				{
					versionNumber: 4,
					commitMessage: 'Changed the glaze',
					slug: 'buns',
					title: 'Cardamom buns',
					username: 'maria',
					href: '/recipes/buns/diff?from=3&to=4'
				}
			]
		});
		const section = screen.getByRole('heading', { name: 'Recent changes' }).closest('section')!;
		const link = within(section).getByRole('link');
		expect(link).toHaveAttribute('href', '/recipes/buns/diff?from=3&to=4');
		expect(link).toHaveTextContent('v4 of Cardamom buns');
		expect(link).toHaveTextContent('@maria');
		expect(link).toHaveTextContent('Changed the glaze');
	});

	test('every grid card names its cook above the photo', () => {
		// The lead is in the grid too, so the count is the grid's.
		const lead = makeCard(9);
		const recipes = [lead, makeCard(1), makeCard(2)];
		const { container } = renderDiscover({ lead, recipes });
		const cards = container.querySelectorAll('.discover-grid .recipe-card');
		expect(cards).toHaveLength(recipes.length);
		expect(cards[1].querySelector('.card-cook')).toHaveTextContent('@cook1');
		expect(screen.getByText(`${recipes.length} recipes`)).toBeInTheDocument();
	});

	test('the friends toggle shows only when the loader offers it', () => {
		const { unmount } = renderDiscover();
		expect(screen.queryByRole('button', { name: 'Friends’ recipes' })).toBeNull();
		unmount();
		renderDiscover({ friendsOnly: false });
		expect(screen.getByRole('button', { name: 'Friends’ recipes' })).toBeInTheDocument();
	});

	test('a filter with no match says so and offers to clear', () => {
		renderDiscover({ searchQuery: 'saffron' });
		expect(screen.getByRole('status')).toHaveTextContent('0 recipes match');
		expect(screen.getByRole('link', { name: 'Clear filters' })).toBeInTheDocument();
	});
});

// A long unbroken title must wrap inside the lead's words column rather than
// push Discover wider than the screen.
describe('Discover lead title', () => {
	test('breaks a long word anywhere', () => {
		expect(cssRule(source, '.lead-title')).toMatch(/overflow-wrap:\s*anywhere;/);
	});
});
