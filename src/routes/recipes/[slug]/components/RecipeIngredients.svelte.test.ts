import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

type GramResult = { grams: number; approximate: boolean } | null;

function renderWith(text: string, results?: GramResult[]) {
	fetchMock.mockResolvedValue(Response.json({ results: results ?? [] }));
	const currentVersion = { ingredients: parseIngredientText(text) } as never;
	return render(RecipeIngredients, { props: { currentVersion } });
}

const LINES = '2¼ cups all-purpose flour\n2 large eggs\nsalt to taste';

beforeEach(() => fetchMock.mockReset());

describe('RecipeIngredients', () => {
	test('prints each ingredient line as typed', () => {
		renderWith(LINES);
		expect(screen.getByText('2¼ cups all-purpose flour')).toBeInTheDocument();
		expect(screen.getByText('2 large eggs')).toBeInTheDocument();
		expect(screen.getByText('salt to taste')).toBeInTheDocument();
	});

	test('shows grams, marks estimates with ≈, and explains the estimate', async () => {
		renderWith(LINES, [
			{ grams: 281, approximate: false },
			{ grams: 100, approximate: true },
			null
		]);
		await fireEvent.click(screen.getByRole('button', { name: 'g' }));
		await waitFor(() => expect(screen.getByText(/281g/)).toBeInTheDocument());
		expect(screen.getByText(/≈100g/)).toBeInTheDocument();
		expect(screen.queryByText(/≈281g/)).not.toBeInTheDocument();
		// An unconverted line still shows as typed.
		expect(screen.getByText('salt to taste')).toBeInTheDocument();
		expect(screen.getByText(/estimates/i)).toBeInTheDocument();
	});

	test('shows no estimate note when nothing shown is approximate', async () => {
		renderWith('1 cup flour', [{ grams: 125, approximate: false }]);
		await fireEvent.click(screen.getByRole('button', { name: 'g' }));
		await waitFor(() => expect(screen.getByText(/125g/)).toBeInTheDocument());
		expect(screen.queryByText(/estimates/i)).not.toBeInTheDocument();
	});
});
