import { describe, test, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import CookbookPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), snapshot: vi.fn(), afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/cookbook') } }));

const recipe = {
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
	kept: false
};

// Select needs script: before hydration, or without JavaScript, it is not drawn.
describe('Cookbook, server rendered', () => {
	test('has the filter tools but no Select', () => {
		const { body } = render(CookbookPage, {
			props: {
				data: {
					recipes: [recipe],
					next: null,
					total: 1,
					counts: { all: 1, mine: 1, saved: 0, trash: 0 },
					inView: { all: 1, mine: 1, saved: 0 },
					collections: [],
					collection: null,
					filter: 'all',
					view: 'grid',
					sort: 'newest',
					allTags: [],
					searchQuery: '',
					selectedTags: []
				}
			} as never
		});
		expect(body).toContain('aria-label="View"');
		expect(body).not.toMatch(/>\s*Select\s*</);
		expect(body).not.toContain('aria-pressed');
	});

	// The picker's panel needs script; without it the two groups are plain links.
	test('without script the collections and tags are links to their lists', () => {
		const { body } = render(CookbookPage, {
			props: {
				data: {
					recipes: [recipe],
					next: null,
					total: 1,
					counts: { all: 1, mine: 1, saved: 0, trash: 0 },
					inView: { all: 1, mine: 1, saved: 0 },
					collections: [{ id: 4, name: 'Quick', count: 1 }],
					collection: null,
					filter: 'all',
					view: 'grid',
					sort: 'newest',
					allTags: [{ id: 2, name: 'Baking', slug: 'baking' }],
					searchQuery: '',
					selectedTags: []
				}
			} as never
		});
		const fallback = body.slice(body.indexOf('<noscript>'), body.indexOf('</noscript>'));
		expect(fallback).toContain('href="?collection=4"');
		expect(fallback).toContain('href="?tags=baking"');
	});
});
