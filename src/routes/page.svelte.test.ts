import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), snapshot: vi.fn() }));
vi.mock('$app/state', () => ({ page }));

// Signed out, home is Discover; the landing hero and its sample diff are gone.
describe('/+page.svelte', () => {
	test('renders Discover, with no landing hero', () => {
		render(Page, {
			props: {
				data: {
					lead: null,
					recentChanges: [],
					recipes: [],
					allTags: [],
					searchQuery: '',
					selectedTags: [],
					user: null,
					profile: null
				}
			} as never
		});
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings).toHaveLength(1);
		expect(headings[0]).toHaveTextContent('Discover');
		expect(screen.queryByText('Recipes that remember every change.')).toBeNull();
	});
});
