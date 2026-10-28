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

	test('forking is one click: the button submits the fork, there is no dialog', () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		const fork = screen.getByRole('button', { name: 'Fork this recipe' });
		expect(fork).toHaveAttribute('type', 'submit');
		expect(fork.closest('form')).toHaveAttribute('action', '?/fork');
		expect(document.querySelector('dialog')).toBeNull();
	});

	test('logged out, there is nothing to do and nothing is rendered', () => {
		const { container } = render(RecipeActions, { props: makeProps({ canFavorite: false }) });
		expect(container.querySelector('.actions')).toBeNull();
	});

	test('the owner gets Edit in marigold, first, since Fork is not offered', () => {
		render(RecipeActions, { props: makeProps({ isOwner: true }) });
		const edit = screen.getByRole('link', { name: /edit recipe/i });
		expect(edit).toHaveClass('btn-primary');
		const favorite = screen.getByRole('button', { name: /favorite/i });
		expect(edit.compareDocumentPosition(favorite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
