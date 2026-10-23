import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';

type GramResult = { grams: number; approximate: boolean } | null;

function renderWith(text: string, grams: GramResult[]) {
	return render(RecipeIngredients, { props: { ingredients: parseIngredientText(text), grams } });
}

const LINES = '2¼ cups all-purpose flour\n2 large eggs\nsalt to taste';

function rows() {
	return screen.getAllByRole('checkbox');
}

describe('RecipeIngredients', () => {
	test('prints each ingredient line as typed when no weight is known', () => {
		renderWith(LINES, [null, null, null]);
		expect(rows()[0]).toHaveTextContent('2¼ cups all-purpose flour');
		expect(rows()[1]).toHaveTextContent('2 large eggs');
		expect(rows()[2]).toHaveTextContent('salt to taste');
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});

	test('works the weight into the line: after the measure, or trailing for a counted line', () => {
		renderWith(LINES, [
			{ grams: 281, approximate: false },
			{ grams: 100, approximate: true },
			null
		]);
		expect(rows()[0]).toHaveTextContent('2¼ cups (281g) all-purpose flour');
		expect(rows()[1]).toHaveTextContent('2 large eggs (≈100g)');
		expect(rows()[2]).toHaveTextContent('salt to taste');
		expect(screen.getByText(/estimates/i)).toBeInTheDocument();
	});

	test('sets the weight apart as an accent', () => {
		renderWith('1 cup flour', [{ grams: 125, approximate: false }]);
		const accent = screen.getByText('(125g)');
		expect(accent).toHaveClass('text-sienna');
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});

	test('rounds to 0.1g below ten grams and to whole grams above', () => {
		renderWith('1 tsp salt\n1 cup flour', [
			{ grams: 5.6789, approximate: false },
			{ grams: 125.4, approximate: false }
		]);
		expect(screen.getByText('(5.7g)')).toBeInTheDocument();
		expect(screen.getByText('(125g)')).toBeInTheDocument();
	});

	test('shows no estimate note when nothing shown is approximate', () => {
		renderWith('1 cup flour', [{ grams: 125, approximate: false }]);
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});
});
