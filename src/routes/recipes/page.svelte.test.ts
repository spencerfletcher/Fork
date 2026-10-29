import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipesPage from './+page.svelte';

const RECIPE = {
	id: 1,
	slug: 'soup',
	title: 'Soup',
	description: null,
	imageUrl: null,
	parentId: null,
	prepTimeMinutes: null,
	cookTimeMinutes: null,
	createdAt: new Date()
};

describe('Recipes page, the owner list', () => {
	test('the grid sits under an h2 eyebrow, so the headings do not skip from h1 to h3', () => {
		render(RecipesPage, {
			props: { data: { mine: true, recipes: [RECIPE], tags: [] } } as never
		});
		expect(screen.getByRole('heading', { level: 1, name: 'My Recipes' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 2, name: '1 recipe' })).toHaveClass(
			'eyebrow-label'
		);
	});
});
