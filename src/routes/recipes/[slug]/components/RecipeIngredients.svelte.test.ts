import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';

type GramResult = { grams: number; approximate: boolean } | null;

function renderWith(text: string, grams: GramResult[]) {
	return render(RecipeIngredients, { props: { ingredients: parseIngredientText(text), grams } });
}

const LINES = '2¼ cups all-purpose flour\n2 large eggs\nsalt to taste';

describe('RecipeIngredients', () => {
	test('prints each ingredient line as typed when no weight is known', () => {
		renderWith(LINES, [null, null, null]);
		expect(screen.getByText('2¼ cups all-purpose flour')).toBeInTheDocument();
		expect(screen.getByText('2 large eggs')).toBeInTheDocument();
		expect(screen.getByText('salt to taste')).toBeInTheDocument();
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});

	test('works the weight into the line: after the measure, or trailing for a counted line', () => {
		renderWith(LINES, [
			{ grams: 281, approximate: false },
			{ grams: 100, approximate: true },
			null
		]);
		expect(screen.getByText('2¼ cups (281g) all-purpose flour')).toBeInTheDocument();
		expect(screen.getByText('2 large eggs (≈100g)')).toBeInTheDocument();
		expect(screen.getByText('salt to taste')).toBeInTheDocument();
		expect(screen.getByText(/estimates/i)).toBeInTheDocument();
	});

	test('shows no estimate note when nothing shown is approximate', () => {
		renderWith('1 cup flour', [{ grams: 125, approximate: false }]);
		expect(screen.getByText('1 cup (125g) flour')).toBeInTheDocument();
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});
});
