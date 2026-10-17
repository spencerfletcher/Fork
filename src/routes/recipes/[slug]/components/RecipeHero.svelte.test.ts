import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeHero from './RecipeHero.svelte';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecipe(overrides: Record<string, unknown> = {}) {
	return {
		id: 99,
		authorId: 'user-1',
		slug: 'my-fork',
		title: 'My Fork',
		description: null,
		imageUrl: null,
		servings: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null,
		parentId: null,
		forkedAt: null,
		isPublic: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		parent: null,
		...overrides
	};
}

function renderHero(recipe: ReturnType<typeof makeRecipe>) {
	render(RecipeHero, {
		props: {
			recipe: recipe as never,
			currentVersion: null,
			isViewingHistory: false,
			tags: [],
			totalMinutes: 0
		}
	});
}

// ─── Fork attribution ─────────────────────────────────────────────────────────

describe('RecipeHero fork attribution', () => {
	test('links to a visible parent with its author', () => {
		renderHero(
			makeRecipe({
				parentId: 42,
				parent: { slug: 'original', title: 'The Original', author: { username: 'chef' } }
			})
		);
		expect(screen.getByRole('link', { name: 'The Original' })).toHaveAttribute(
			'href',
			'/recipes/original'
		);
		expect(screen.getByText(/by @chef/)).toBeInTheDocument();
	});

	test('says the parent is private when the server withheld it', () => {
		renderHero(makeRecipe({ parentId: 42, parent: null }));
		expect(screen.getByText('Forked from a private recipe')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	test('shows no attribution for a recipe that is not a fork', () => {
		renderHero(makeRecipe());
		expect(screen.queryByText(/Forked from/)).not.toBeInTheDocument();
	});
});
