import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Layout from './+layout.svelte';

// The layout reads the route and any thrown error from page state.
const state = vi.hoisted(() => ({
	page: {
		route: { id: '/recipes/[slug]' as string | null },
		error: null as { message: string } | null,
		url: new URL('http://localhost/recipes/no-such-recipe'),
		data: {}
	}
}));
vi.mock('$app/state', () => state);
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }), applyAction: vi.fn() }));

const children = createRawSnippet(() => ({ render: () => '<p>The page</p>' }));

function renderLayout(routeId: string, error: { message: string } | null = null) {
	state.page.route.id = routeId;
	state.page.error = error;
	return render(Layout, { props: { data: { user: null, profile: null }, children } });
}

describe('layout skip link', () => {
	test('a recipe skips past its header to the ingredients', () => {
		renderLayout('/recipes/[slug]');
		expect(screen.getByRole('link', { name: 'Skip to ingredients' })).toHaveAttribute(
			'href',
			'#recipe'
		);
	});

	test('a recipe that failed to load has no #recipe: it skips to the content', () => {
		renderLayout('/recipes/[slug]', { message: 'Recipe not found' });
		expect(screen.queryByRole('link', { name: 'Skip to ingredients' })).toBeNull();
		expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
	});

	test('any other page skips to the content', () => {
		renderLayout('/recipes');
		expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
	});
});
