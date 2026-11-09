import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import Discover from './Discover.svelte';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/discover') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
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

const renderDiscover = (overrides: Partial<typeof base> = {}) =>
	render(Discover, { props: { data: { ...base, ...overrides } } as never });

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
		const lead = screen.getByRole('link', { name: /Cardamom Buns/ });
		expect(lead).toHaveAttribute('href', '/recipes/r-9');
		expect(within(lead).getByText('@cook9')).toBeInTheDocument();
		expect(within(lead).getByText('1h 10m')).toBeInTheDocument();
		expect(within(lead).getByText('Serves 12')).toBeInTheDocument();
		expect(within(lead).getByText('v3')).toBeInTheDocument();
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
		const { container } = renderDiscover({ lead: makeCard(9), recipes: [makeCard(1), makeCard(2)] });
		const cards = container.querySelectorAll('.discover-grid .recipe-card');
		expect(cards).toHaveLength(2);
		expect(cards[0].querySelector('.card-cook')).toHaveTextContent('@cook1');
		expect(screen.getByText('3 recipes')).toBeInTheDocument();
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
		expect(screen.getByRole('status')).toHaveTextContent('0 recipes found');
		expect(screen.getByRole('link', { name: 'Clear filters' })).toBeInTheDocument();
	});
});
