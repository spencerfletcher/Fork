import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CookbookPage from './+page.svelte';
import { COOKBOOK_FILTERS } from './filters.js';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/cookbook') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({ page }));

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
	counts: { all: 0, mine: 0, saved: 0 },
	filter: 'all' as (typeof COOKBOOK_FILTERS)[number],
	allTags: [],
	searchQuery: '',
	selectedTags: [] as string[]
};

function renderCookbook(overrides: Partial<typeof base> = {}) {
	return render(CookbookPage, { props: { data: { ...base, ...overrides } } as never });
}

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
	counts: { all: 9, mine: 6, saved: 3 }
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

	test('the filter links keep the search and the tags', () => {
		page.url = new URL('http://localhost/cookbook?q=dal&tags=baking&filter=mine');
		renderCookbook({ ...full, filter: 'mine', searchQuery: 'dal', selectedTags: ['baking'] });
		const href = (name: string) =>
			screen.getByRole('link', { name: new RegExp(`^${name}`) }).getAttribute('href');
		expect(href('Saved')).toBe('?q=dal&tags=baking&filter=saved');
		expect(href('All')).toBe('?q=dal&tags=baking');
	});

	test('a filter that empties the grid keeps the filters and says 0 recipes match', () => {
		renderCookbook({ ...full, recipes: [], searchQuery: 'saffron' });
		expect(screen.getByRole('searchbox')).toHaveValue('saffron');
		expect(screen.getByRole('status')).toHaveTextContent('0 recipes match');
		expect(screen.getByRole('heading', { name: 'No recipes match “saffron”.' })).toBeVisible();
		expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute('href', '/cookbook');
	});

	test('the status stays quiet over the unfiltered library', () => {
		renderCookbook(full);
		expect(screen.getByRole('status')).toHaveTextContent('');
	});

	test('New recipe sits in the header over a full library', () => {
		renderCookbook(full);
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveClass('btn-primary');
	});
});
