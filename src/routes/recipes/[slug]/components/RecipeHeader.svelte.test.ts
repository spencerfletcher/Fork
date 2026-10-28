import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeHeader from './RecipeHeader.svelte';
import type { ComponentProps } from 'svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HeaderProps = ComponentProps<typeof RecipeHeader>;

function makeRecipe(overrides: Partial<HeaderProps['recipe']> = {}): HeaderProps['recipe'] {
	return { slug: 'my-fork', parentId: null, parent: null, ...overrides };
}

function renderHeader(
	recipe: HeaderProps['recipe'],
	currentVersion: HeaderProps['currentVersion'] = VERSION,
	tags: HeaderProps['tags'] = []
) {
	render(RecipeHeader, { props: { recipe, currentVersion, isViewingHistory: false, tags } });
}

const VERSION = {
	id: 1,
	versionNumber: 1,
	commitMessage: 'Initial recipe',
	...makeContent({ title: 'Old Title', servings: 4, description: 'Crisp edges.', imageUrl: null })
};

// ─── Fork attribution ─────────────────────────────────────────────────────────

describe('RecipeHeader fork attribution', () => {
	test('links to a visible parent with its author', () => {
		renderHeader(
			makeRecipe({
				parentId: 42,
				parent: { slug: 'original', title: 'The Original', author: { username: 'chef' } }
			})
		);
		expect(screen.getByRole('link', { name: 'The Original' })).toHaveAttribute(
			'href',
			'/recipes/original'
		);
		// Usernames are mono everywhere, this line included.
		expect(screen.getByText('@chef')).toHaveClass('font-mono');
	});

	test('says the parent is private when the server withheld it', () => {
		renderHeader(makeRecipe({ parentId: 42, parent: null }));
		expect(screen.getByText('Forked from a private recipe')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	test('shows no attribution for a recipe that is not a fork', () => {
		renderHeader(makeRecipe());
		expect(screen.queryByText(/Forked from/)).not.toBeInTheDocument();
	});
});

// ─── Versioned content ────────────────────────────────────────────────────────

describe('RecipeHeader versioned content', () => {
	test("shows the viewed version's title", () => {
		renderHeader(makeRecipe(), VERSION);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Old Title');
	});

	test('shows Serves from the viewed version', () => {
		renderHeader(makeRecipe(), VERSION);
		expect(screen.getByText('Serves 4')).toBeInTheDocument();
	});

	test('a blank servings on the viewed version shows no Serves', () => {
		renderHeader(makeRecipe(), { ...VERSION, servings: null });
		expect(screen.queryByText(/Serves/)).toBeNull();
	});
});

// ─── Header content ───────────────────────────────────────────────────────────

describe('RecipeHeader content', () => {
	test('shows the version as a chip beside the title', () => {
		renderHeader(makeRecipe(), { ...VERSION, versionNumber: 3 });
		expect(screen.getByText('v3')).toHaveClass('bg-marigold');
	});

	test('shows the description under the title', () => {
		renderHeader(makeRecipe(), VERSION);
		expect(screen.getByText('Crisp edges.')).toBeInTheDocument();
	});

	test('lists tags as comma-separated links, not pills', () => {
		renderHeader(makeRecipe(), VERSION, [
			{ id: 1, name: 'Dessert', slug: 'dessert' },
			{ id: 2, name: 'Baking', slug: 'baking' }
		]);
		const dessert = screen.getByRole('link', { name: 'Dessert' });
		expect(dessert).toHaveAttribute('href', '/tags/dessert');
		expect(dessert).not.toHaveClass('tag');
		// No colour override: links are clay by default, and these should read as links.
		expect(dessert.className).not.toMatch(/text-text/);
		expect(dessert.parentElement).toHaveTextContent('Dessert, Baking');
	});

	test('carries no photo: that lives in the sidebar now', () => {
		renderHeader(makeRecipe(), { ...VERSION, imageUrl: 'https://img/cookies.jpg' });
		expect(screen.queryByRole('img')).toBeNull();
	});

	test('renders no meta line when there is no time, servings or tags', () => {
		const { container } = render(RecipeHeader, {
			props: {
				recipe: makeRecipe(),
				currentVersion: {
					...VERSION,
					servings: null,
					prepTimeMinutes: null,
					cookTimeMinutes: null
				},
				isViewingHistory: false,
				tags: []
			}
		});
		expect(container.querySelector('.meta')).toBeNull();
	});

	test('links the author once, in a line under the title', () => {
		renderHeader(makeRecipe({ author: { id: 'u1', username: 'chef' } }), VERSION);
		const [link] = screen.getAllByRole('link', { name: '@chef' });
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
