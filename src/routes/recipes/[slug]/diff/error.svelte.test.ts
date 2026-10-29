import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';

// ─── SvelteKit module mocks ───────────────────────────────────────────────────

const { pageState } = vi.hoisted(() => ({
	pageState: {
		status: 400,
		error: { message: '' } as { message: string } | null,
		params: { slug: 'classic-cookies' },
		url: new URL('http://localhost/recipes/classic-cookies/diff'),
		route: { id: '/recipes/[slug]/diff' }
	}
}));

vi.mock('$app/state', () => ({ page: pageState }));

function renderError(status: number, message: string) {
	pageState.status = status;
	pageState.error = { message };
	return render(ErrorPage);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('compare page error', () => {
	test('a version that does not exist: pick two versions, and a way back to the recipe', () => {
		renderError(400, 'Version not found in Classic Cookies');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 400 – Version not found in Classic Cookies'
		);
		expect(screen.getByText("Pick two of the recipe's versions to compare.")).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to the recipe' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies'
		);
	});

	test('a version that does not exist: the main action compares first and latest, back is secondary', () => {
		// The heading asks for two versions, so the page offers a pair: the bare
		// compare URL, which the loader reads as first to latest.
		renderError(400, 'Version not found in Classic Cookies');
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

	test('a 404 keeps the generic line and goes home', () => {
		renderError(404, 'Recipe not found');
		expect(screen.getByText(/doesn't exist or something went wrong/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
	});

	test("takes the root error page's format: the code in the h1 at the site size, centred, no display number", () => {
		const { container } = renderError(400, 'Version not found in Classic Cookies');
		expect(container.querySelector('h1')!.className).not.toMatch(/rem/);
		expect(container.querySelector('.font-mono')).toBeNull();
		const block = container.querySelector('.auth-page .error-page')!;
		expect(block).not.toBeNull();
		expect(block.className).toMatch(/text-center/);
	});
});
