import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeActions from './RecipeActions.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		recipe: { slug: 'cookies', title: 'Cookies' },
		canFork: false,
		canFavorite: true,
		isOwner: false,
		isViewingHistory: false,
		initialFavorited: false,
		...overrides
	};
}

// ─── Save button ──────────────────────────────────────────────────────────────

describe('RecipeActions save button', () => {
	test('reflects the initial favourite state', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		expect(screen.getByRole('button', { name: 'Unfavorite' })).toHaveTextContent('Favorited');
	});

	test('follows the prop when the page moves to a recipe with a different state', async () => {
		// Navigating from one recipe to another (e.g. a fork's "Forked from" link)
		// reuses this component, so only the prop changes.
		const { rerender } = render(RecipeActions, { props: makeProps({ initialFavorited: true }) });

		await rerender(
			makeProps({ recipe: { slug: 'original', title: 'Original' }, initialFavorited: false })
		);

		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveTextContent('Favorite');
	});
});

// ─── Primary action ───────────────────────────────────────────────────────────

describe('RecipeActions primary action', () => {
	test('a visitor who can fork gets Fork in marigold and Favorite outlined', () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		expect(screen.getByRole('button', { name: 'Fork this recipe' })).toHaveClass('btn-primary');
		expect(screen.getByRole('button', { name: /favorite/i })).toHaveClass('btn-ghost');
	});

	test('the owner gets Edit in marigold, since Fork is not offered', () => {
		render(RecipeActions, { props: makeProps({ isOwner: true }) });
		expect(screen.getByRole('link', { name: /edit recipe/i })).toHaveClass('btn-primary');
	});
});
