import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeHero from './RecipeHero.svelte';
import type { ComponentProps } from 'svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HeroProps = ComponentProps<typeof RecipeHero>;

function makeRecipe(overrides: Partial<HeroProps['recipe']> = {}): HeroProps['recipe'] {
	return { slug: 'my-fork', parentId: null, parent: null, ...overrides };
}

function renderHero(
	recipe: HeroProps['recipe'],
	currentVersion: HeroProps['currentVersion'] = VERSION
) {
	render(RecipeHero, { props: { recipe, currentVersion, isViewingHistory: false, tags: [] } });
}

const VERSION = {
	id: 1,
	versionNumber: 1,
	commitMessage: 'Initial recipe',
	...makeContent({ title: 'Old Title', servings: 4 })
};

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

// ─── Versioned content ────────────────────────────────────────────────────────

describe('RecipeHero versioned content', () => {
	test("shows the viewed version's title", () => {
		renderHero(makeRecipe(), VERSION);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Old Title');
	});

	test('shows Serves from the viewed version', () => {
		renderHero(makeRecipe(), VERSION);
		expect(screen.getByText('Serves 4')).toBeInTheDocument();
	});

	test('a blank servings on the viewed version shows no Serves', () => {
		renderHero(makeRecipe(), { ...VERSION, servings: null });
		expect(screen.queryByText(/Serves/)).toBeNull();
	});
});
