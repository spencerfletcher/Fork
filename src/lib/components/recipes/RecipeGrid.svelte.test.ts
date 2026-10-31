import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import RecipeGrid from './RecipeGrid.svelte';

const card = (id: number) => ({
	id,
	slug: `recipe-${id}`,
	title: `Recipe ${id}`,
	description: null,
	imageUrl: `https://img/${id}.jpg`,
	parentId: null,
	prepTimeMinutes: null,
	cookTimeMinutes: null
});

describe('RecipeGrid', () => {
	test('counts the recipes in the section eyebrow, plural from two', () => {
		render(RecipeGrid, { props: { recipes: [1, 2, 3].map(card) } });
		const heading = screen.getByRole('heading', { level: 2 });
		expect(heading).toHaveTextContent('3 recipes');
		expect(heading).toHaveClass('eyebrow-label', 'section-heading');
	});

	test('one recipe reads singular', () => {
		render(RecipeGrid, { props: { recipes: [card(1)] } });
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('1 recipe');
	});

	test('counts in the noun it is given', () => {
		const { unmount } = render(RecipeGrid, { props: { recipes: [card(1)], noun: 'fork' } });
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('1 fork');
		unmount();
		render(RecipeGrid, { props: { recipes: [card(1), card(2)], noun: 'fork' } });
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 forks');
	});

	test('a card per recipe in the shared grid, each knowing its place', () => {
		const recipes = [1, 2, 3, 4, 5].map(card);
		const { container } = render(RecipeGrid, { props: { recipes } });
		const imgs = [...container.querySelectorAll('.recipe-grid img.card-img')];
		expect(imgs).toHaveLength(recipes.length);
		expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
		expect(imgs.at(-1)).toHaveAttribute('loading', 'lazy');
	});

	test('a card snippet replaces the default card, given the recipe and its place', () => {
		const recipes = [card(7), card(8)];
		const cardSnippet = createRawSnippet((recipe: () => { title: string }, i: () => number) => ({
			render: () => `<p class="custom">${recipe().title} at ${i()}</p>`
		}));
		const { container } = render(RecipeGrid, { props: { recipes, card: cardSnippet } });
		expect(
			[...container.querySelectorAll('.recipe-grid .custom')].map((p) => p.textContent)
		).toEqual(recipes.map((r, i) => `${r.title} at ${i}`));
		expect(container.querySelector('.recipe-card')).toBeNull();
	});
});
