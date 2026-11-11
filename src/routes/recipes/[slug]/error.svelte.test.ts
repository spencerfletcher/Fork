import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';
import { VERSION_NOT_FOUND } from './versionError.js';
import { MISSING_RECIPE_LEDE, SERVER_ERROR_LEDE } from '#lib/errors/copy.js';
import { NOT_AUTHORIZED } from '#lib/server/visibility.js';

// ─── SvelteKit module mocks ───────────────────────────────────────────────────

const { pageState } = vi.hoisted(() => ({
	pageState: {
		status: 404,
		error: { message: '' } as { message: string } | null,
		params: { slug: 'classic-cookies' },
		url: new URL('http://localhost/recipes/classic-cookies')
	}
}));

vi.mock('$app/state', () => ({ page: pageState }));

function renderError(status: number, message: string, path = '/recipes/classic-cookies') {
	pageState.status = status;
	pageState.error = { message };
	pageState.url = new URL(path, 'http://localhost');
	return render(ErrorPage);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('recipe page error', () => {
	test('a version the recipe does not have: the way back is to the recipe', () => {
		// The recipe exists, so the root page's "may be private" lede was wrong.
		renderError(404, VERSION_NOT_FOUND, '/recipes/classic-cookies?version=9');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			`Error 404 – ${VERSION_NOT_FOUND}`
		);
		expect(screen.queryByText(MISSING_RECIPE_LEDE)).toBeNull();
		const back = screen.getByRole('link', { name: 'Back to the recipe' });
		expect(back).toHaveAttribute('href', '/recipes/classic-cookies');
		expect(back).toHaveClass('btn-primary');
		expect(screen.queryByRole('link', { name: 'Go home' })).toBeNull();
	});

	test('a missing recipe answers as the root page does: its lede, home and a search', () => {
		renderError(404, 'Recipe not found');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 404 – Recipe not found'
		);
		expect(screen.getByText(MISSING_RECIPE_LEDE)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		expect(screen.getByRole('link', { name: 'Search recipes' })).toHaveAttribute('href', '/search');
		expect(screen.queryByRole('link', { name: 'Back to the recipe' })).toBeNull();
	});

	test('the edit page’s errors under this route keep the root page too', () => {
		renderError(403, NOT_AUTHORIZED, '/recipes/classic-cookies/edit');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			`Error 403 – ${NOT_AUTHORIZED}`
		);
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		expect(screen.queryByRole('link', { name: 'Back to the recipe' })).toBeNull();
	});

	test("a 500 takes the root page's lede", () => {
		renderError(500, 'Internal Error');
		expect(screen.getByText(SERVER_ERROR_LEDE)).toBeInTheDocument();
	});
});
