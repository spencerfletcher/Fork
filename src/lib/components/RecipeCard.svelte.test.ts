import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeCard from './RecipeCard.svelte';

const { mockGoto } = vi.hoisted(() => ({ mockGoto: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: mockGoto }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecipe(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		authorId: 'user-1',
		slug: 'chocolate-cake-abc123',
		title: 'Chocolate Cake',
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
		...overrides
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RecipeCard', () => {
	test('renders the recipe title', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ title: 'Banana Bread' }) } });
		expect(screen.getByText('Banana Bread')).toBeInTheDocument();
	});

	test('navigates to the recipe slug on click', async () => {
		mockGoto.mockClear();
		render(RecipeCard, { props: { recipe: makeRecipe({ slug: 'banana-bread-xyz' }) } });
		// The card is a div[role="link"] — clicking it calls goto()
		fireEvent.click(screen.getByRole('link'));
		expect(mockGoto).toHaveBeenCalledWith('/recipes/banana-bread-xyz');
	});

	test('shows "Forked" badge when parentId is set', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ parentId: 42 }) } });
		expect(screen.getByText('Forked')).toBeInTheDocument();
	});

	test('does not show "Forked" badge when parentId is null', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ parentId: null }) } });
		expect(screen.queryByText('Forked')).not.toBeInTheDocument();
	});

	test('shows combined total time when both prep and cook time are set', () => {
		render(RecipeCard, {
			props: { recipe: makeRecipe({ prepTimeMinutes: 20, cookTimeMinutes: 30 }) }
		});
		expect(screen.getByText('50 min')).toBeInTheDocument();
	});

	test('shows prep-only label when only prepTimeMinutes is set', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ prepTimeMinutes: 15 }) } });
		expect(screen.getByText('15 min prep')).toBeInTheDocument();
	});

	test('shows cook-only label when only cookTimeMinutes is set', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ cookTimeMinutes: 45 }) } });
		expect(screen.getByText('45 min cook')).toBeInTheDocument();
	});

	test('shows description when present', () => {
		render(RecipeCard, {
			props: { recipe: makeRecipe({ description: 'A rich and moist cake.' }) }
		});
		expect(screen.getByText('A rich and moist cake.')).toBeInTheDocument();
	});

	test('does not show description when absent', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ description: null }) } });
		// No description paragraph — just verify title is there and nothing throws
		expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
	});

	test('renders up to 3 tags', () => {
		const recipe = {
			...makeRecipe(),
			recipesToTags: [
				{ tag: { id: 1, name: 'Dessert', slug: 'dessert' } },
				{ tag: { id: 2, name: 'Baking', slug: 'baking' } },
				{ tag: { id: 3, name: 'American', slug: 'american' } },
				{ tag: { id: 4, name: 'Snack', slug: 'snack' } } // 4th should be hidden
			]
		};
		render(RecipeCard, { props: { recipe } });
		expect(screen.getByText('Dessert')).toBeInTheDocument();
		expect(screen.getByText('Baking')).toBeInTheDocument();
		expect(screen.getByText('American')).toBeInTheDocument();
		expect(screen.queryByText('Snack')).not.toBeInTheDocument();
	});

	test('renders no tags when recipesToTags is absent', () => {
		render(RecipeCard, { props: { recipe: makeRecipe() } });
		// Should render without throwing; title is visible
		expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
	});
});
