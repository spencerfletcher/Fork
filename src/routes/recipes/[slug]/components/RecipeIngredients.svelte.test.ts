import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';

type GramResult = { grams: number; grams2: number | null; approximate: boolean } | null;

function renderWith(text: string, grams: GramResult[]) {
	return render(RecipeIngredients, { props: { ingredients: parseIngredientText(text), grams } });
}

const LINES = '2¼ cups all-purpose flour\n2 large eggs\nsalt to taste';

/** The visible rows: each is the label wrapping a native checkbox. */
function rows() {
	return screen.getAllByRole('checkbox').map((box) => box.closest('label')!);
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
			{ grams: 281, grams2: null, approximate: false },
			{ grams: 100, grams2: null, approximate: true },
			null
		]);
		expect(rows()[0]).toHaveTextContent('2¼ cups (281g) all-purpose flour');
		expect(rows()[1]).toHaveTextContent('2 large eggs (≈100g)');
		expect(rows()[2]).toHaveTextContent('salt to taste');
		expect(screen.getByText(/estimates/i)).toBeInTheDocument();
	});

	test('sets the weight apart as an accent', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false }]);
		const accent = screen.getByText('(125g)');
		expect(accent).toHaveClass('text-sienna');
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});

	test('rounds to 0.1g below ten grams and to whole grams above', () => {
		renderWith('1 tsp salt\n1 cup flour', [
			{ grams: 5.6789, grams2: null, approximate: false },
			{ grams: 125.4, grams2: null, approximate: false }
		]);
		expect(screen.getByText('(5.7g)')).toBeInTheDocument();
		expect(screen.getByText('(125g)')).toBeInTheDocument();
	});

	test('shows both ends of a range', () => {
		renderWith('1-2 cups water\n2-3 eggs', [
			{ grams: 240, grams2: 480, approximate: false },
			{ grams: 100, grams2: 150, approximate: true }
		]);
		expect(rows()[0]).toHaveTextContent('1-2 cups (240–480g) water');
		expect(rows()[1]).toHaveTextContent('2-3 eggs (≈100–150g)');
	});

	test('explains that a counted weight is a typical whole-item weight', () => {
		renderWith('2 eggs', [{ grams: 100, grams2: null, approximate: true }]);
		expect(screen.getByText('(≈100g)')).toHaveAttribute('title', expect.stringMatching(/typical/i));
	});

	test('shows no estimate note when nothing shown is approximate', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false }]);
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});

	test('each line is a native checkbox named by its text', async () => {
		renderWith('1 cup flour\n2 eggs', [null, null]);
		const flour = screen.getByRole('checkbox', { name: /1 cup flour/ });
		expect(flour).not.toBeChecked();
		await fireEvent.click(rows()[0]);
		expect(flour).toBeChecked();
		await fireEvent.click(rows()[0]);
		expect(flour).not.toBeChecked();
	});
});
