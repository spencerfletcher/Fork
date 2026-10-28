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
		editRevision: 0,
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

	test('never shows a description, tags or a forked badge', () => {
		const recipe = {
			...makeRecipe({ description: 'A rich and moist cake.', parentId: 42 }),
			recipesToTags: [{ tag: { id: 1, name: 'Dessert', slug: 'dessert' } }]
		};
		const { container } = render(RecipeCard, { props: { recipe } });
		expect(screen.queryByText('A rich and moist cake.')).toBeNull();
		expect(screen.queryByRole('link', { name: 'Dessert' })).toBeNull();
		expect(container.querySelector('.forked-badge')).toBeNull();
	});

	test('a recipe with a photo shows it with the title below', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ imageUrl: 'https://img/cake.jpg' }) }
		});
		expect(screen.getByRole('img', { name: 'Chocolate Cake' })).toHaveAttribute(
			'src',
			'https://img/cake.jpg'
		);
		expect(container.querySelector('h3.card-title')).toHaveTextContent('Chocolate Cake');
		expect(container.querySelector('.card-panel')).toBeNull();
	});

	test('a recipe without a photo shows its title inside the panel and nowhere else', () => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(screen.queryByRole('img')).toBeNull();
		// A heading either way, so screen-reader heading navigation does not
		// depend on whether a photo was uploaded.
		expect(container.querySelector('.card-panel h3.card-panel-title')).toHaveTextContent(
			'Chocolate Cake'
		);
		expect(container.querySelector('h3.card-title')).toBeNull();
		expect(screen.getAllByText('Chocolate Cake')).toHaveLength(1);
	});

	test('the author link is marked so the phone layout can hide it', () => {
		render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author: { id: 'u1', username: 'chefmaria' } } }
		});
		expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('meta-author');
	});

	test('the separator after the author hides with it on phones', () => {
		const { container } = render(RecipeCard, {
			props: {
				recipe: { ...makeRecipe({ versionCount: 2 }), author: { id: 'u1', username: 'chefmaria' } }
			}
		});
		expect(container.querySelector('.meta-sep.meta-author')).not.toBeNull();
	});

	test('no separator is marked when there is no author', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ versionCount: 2, cookTimeMinutes: 10 }) }
		});
		expect(container.querySelector('.meta-sep')).not.toBeNull();
		expect(container.querySelector('.meta-sep.meta-author')).toBeNull();
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
		const metaRow = container.querySelector('.meta-row');
		expect(metaRow?.textContent?.trim().startsWith('·')).toBe(false);
		// The separator is now "not the first part" rather than a condition
		// restating every preceding field, so a lone item renders none at all.
		expect(container.querySelectorAll('.meta-sep')).toHaveLength(0);
	});
});
