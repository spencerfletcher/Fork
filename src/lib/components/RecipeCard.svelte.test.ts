import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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

	test('card links to the recipe slug', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ slug: 'banana-bread-xyz' }) } });
		// Card uses a stretched <a> with aria-label matching the recipe title
		const link = screen.getByRole('link', { name: /chocolate cake/i });
		expect(link).toHaveAttribute('href', '/recipes/banana-bread-xyz');
	});

	test('shows "Forked" badge when parentId is set', () => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe({ parentId: 42 }) } });
		expect(screen.getByText('Forked').closest('.forked-badge')).toBeInTheDocument();
		// The badge overlays the photo, so it must live inside the image container
		// rather than the text block below it.
		expect(container.querySelector('.card-img')?.parentElement).toContainElement(
			container.querySelector('.forked-badge')
		);
	});

	test('omits the "Forked" badge entirely when parentId is null', () => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe({ parentId: null }) } });
		// Absolutely positioned, so it no longer needs to occupy layout space
		// when hidden — it is simply not rendered.
		expect(screen.queryByText('Forked')).not.toBeInTheDocument();
		expect(container.querySelector('.forked-badge')).toBeNull();
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

	test('shows @username link when author is present', () => {
		const recipe = {
			...makeRecipe(),
			author: { id: 'user-1', username: 'chefmaria' }
		};
		render(RecipeCard, { props: { recipe } });
		const link = screen.getByRole('link', { name: '@chefmaria' });
		expect(link).toHaveAttribute('href', '/users/chefmaria');
	});

	test('does not show author link when author is absent', () => {
		render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
	});

	test('shows the latest version number', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 3 }) } });
		expect(screen.getByText(/^v3$/)).toBeInTheDocument();
	});

	test('shows the fork count when the recipe has forks', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 2 }) } });
		expect(screen.getByText(/2 forks/)).toBeInTheDocument();
	});

	test('omits the fork count when there are none', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 0 }) } });
		// Matches the "N fork(s)" text specifically — the unrelated "Forked" badge
		// (hidden via CSS but still present in the DOM) also matches /fork/i.
		expect(screen.queryByText(/\d+ forks?/i)).not.toBeInTheDocument();
	});

	test('uses the singular for one fork', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 1 }) } });
		expect(screen.getByText(/1 fork(?!s)/)).toBeInTheDocument();
	});

	test('does not render a leading separator when author and times are absent', () => {
		// makeRecipe() has no author and null prep/cook times, so versionCount is
		// the first thing in the meta row — its separator must not render.
		// Inspects the whole row rather than a single span: matching just the
		// version-number text would pass even with a leading "·" still rendered.
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ versionCount: 3 }) }
		});
		const metaRow = container.querySelector('.flex.items-center.gap-2');
		expect(metaRow?.textContent?.trim().startsWith('·')).toBe(false);
	});
});
