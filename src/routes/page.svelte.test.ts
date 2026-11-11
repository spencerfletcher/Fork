import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import { ACCOUNT_DELETED, GOODBYE } from '#lib/account.js';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), snapshot: vi.fn() }));
vi.mock('$app/state', () => ({ page }));

// Signed out, home is Discover; the landing hero and its sample diff are gone.
const renderHome = () =>
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

describe('/+page.svelte', () => {
	test('renders Discover, with no landing hero', () => {
		renderHome();
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings).toHaveLength(1);
		expect(headings[0]).toHaveTextContent('Discover');
		expect(screen.queryByText('Recipes that remember every change.')).toBeNull();
	});

	test('after Delete account it says goodbye in one line, and only then', () => {
		renderHome();
		expect(screen.queryByText(GOODBYE)).toBeNull();
		page.url = new URL(ACCOUNT_DELETED, 'http://localhost');
		renderHome();
		expect(screen.getByText(GOODBYE)).toHaveAttribute('role', 'status');
		page.url = new URL('http://localhost/');
	});
});
