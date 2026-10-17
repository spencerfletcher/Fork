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
		expect(screen.getByRole('button', { name: 'Unsave' })).toHaveTextContent('Saved');
	});

	test('follows the prop when the page moves to a recipe with a different state', async () => {
		// Navigating from one recipe to another (e.g. a fork's "Forked from" link)
		// reuses this component, so only the prop changes.
		const { rerender } = render(RecipeActions, { props: makeProps({ initialFavorited: true }) });

		await rerender(
			makeProps({ recipe: { slug: 'original', title: 'Original' }, initialFavorited: false })
		);

		expect(screen.getByRole('button', { name: 'Save' })).toHaveTextContent('Save recipe');
	});
});
