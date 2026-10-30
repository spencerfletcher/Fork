import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';
import source from './+error.svelte?raw';

// ─── SvelteKit module mocks ───────────────────────────────────────────────────

const { pageState } = vi.hoisted(() => ({
	pageState: {
		status: 400,
		error: { message: '' } as { message: string; versionCount?: number } | null,
		params: { slug: 'classic-cookies' },
		url: new URL('http://localhost/recipes/classic-cookies/diff'),
		route: { id: '/recipes/[slug]/diff' }
	}
}));

vi.mock('$app/state', () => ({ page: pageState }));

function renderError(status: number, message: string, versionCount?: number) {
	pageState.status = status;
	pageState.error = { message, versionCount };
	return render(ErrorPage);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('compare page error', () => {
	test('a version that does not exist: the lede names the versions there are, and a way back to the recipe', () => {
		// The page has no picker, so "pick two" asked for something it could
		// not offer; the range says what to type instead.
		renderError(400, 'Version 9 not found', 3);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 400 – Version 9 not found'
		);
		expect(screen.getByText('This recipe has v1 to v3.')).toBeInTheDocument();
		expect(screen.queryByText(/Pick two/)).toBeNull();
		expect(screen.getByRole('link', { name: 'Back to the recipe' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies'
		);
	});

	test('a range that is not a number keeps the generic line', () => {
		renderError(400, 'Version not found');
		expect(screen.getByText("Pick two of the recipe's versions to compare.")).toBeInTheDocument();
		expect(screen.queryByText(/has v1/)).toBeNull();
	});

	test('a version that does not exist: the main action compares first and latest, back is secondary', () => {
		// The heading asks for two versions, so the page offers a pair: the bare
		// compare URL, which the loader reads as first to latest.
		renderError(400, 'Version 9 not found');
		const compare = screen.getByRole('link', { name: 'Compare first and latest' });
		expect(compare).toHaveAttribute('href', '/recipes/classic-cookies/diff');
		expect(compare).toHaveClass('btn-primary');
		expect(screen.getByRole('link', { name: 'Back to the recipe' })).not.toHaveClass('btn-primary');
	});

	test('one version: the helper line agrees with the message instead of asking for a pick', () => {
		// "Pick two of the recipe's versions" under "Need at least two versions"
		// contradicted itself (critique, 29 October 2026).
		renderError(400, 'Need at least two versions to compare');
		expect(screen.queryByText(/Pick two/)).toBeNull();
		expect(
			screen.getByText('Save a change to the recipe, then compare it with the original.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to the recipe' })).toBeInTheDocument();
		// There is no pair to compare.
		expect(screen.queryByRole('link', { name: 'Compare first and latest' })).toBeNull();
	});

	test('the title balances its lines, so "Version 9 not found" never leaves one word dangling', () => {
		expect(source).toMatch(/h1\s*{[^}]*text-wrap:\s*balance/);
	});

	test("a 404 takes the root page's missing-recipe lede, goes home, and offers a search", () => {
		renderError(404, 'Recipe not found');
		expect(
			screen.getByText('It may be an old link, or a recipe its author keeps private.')
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		const search = screen.getByRole('link', { name: 'Search recipes' });
		expect(search).toHaveAttribute('href', '/search');
		expect(search).toHaveClass('btn-ghost');
	});

	test("a 500 takes the root page's lede and goes home, with no search", () => {
		renderError(500, 'Internal Error');
		expect(
			screen.getByText("Something went wrong on Fork's side, not yours. Try again in a moment.")
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		expect(screen.queryByRole('link', { name: 'Search recipes' })).toBeNull();
	});

	test("takes the root error page's format: the code in the h1 at the site size, centred, no display number", () => {
		const { container } = renderError(400, 'Version 9 not found');
		expect(container.querySelector('h1')!.className).not.toMatch(/rem/);
		expect(container.querySelector('.font-mono')).toBeNull();
		const block = container.querySelector('.auth-page .error-page')!;
		expect(block).not.toBeNull();
		expect(block.className).toMatch(/text-center/);
	});
});
