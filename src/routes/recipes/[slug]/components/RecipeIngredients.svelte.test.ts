import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';
import { ticksKey, loadTicks, saveTicks } from './ticks';

type GramResult = { grams: number; grams2: number | null; approximate: boolean } | null;

const KEY = ticksKey('my-fork', 3, 'ingredients');

function renderWith(text: string, grams: GramResult[]) {
	return render(RecipeIngredients, {
		props: { ingredients: parseIngredientText(text), grams, storageKey: KEY }
	});
}

const LINES = '2¼ cups all-purpose flour\n2 large eggs\nsalt to taste';

/** The visible rows: each is the label wrapping a native checkbox. */
function rows() {
	return screen.getAllByRole('checkbox').map((box) => box.closest('label')!);
}

describe('RecipeIngredients', () => {
	test('bolds the whole of a counted line, and nothing on a line without a number', () => {
		renderWith('2 large eggs\nsalt to taste', [null, null]);
		const [eggs, salt] = rows();
		expect(eggs.querySelector('.font-semibold')).toHaveTextContent('2 large eggs');
		expect(eggs).toHaveTextContent('2 large eggs');
		expect(salt.querySelector('.font-semibold')).toBeNull();
	});

	test('sets a typed fraction as the cookbook glyph', () => {
		renderWith('1/2 lemon\n1/4 cup sugar', [null, null]);
		expect(rows()[0]).toHaveTextContent('½ lemon');
		expect(rows()[1]).toHaveTextContent('¼ cup sugar');
	});

	test('is a section the tab bar can jump to, headed by an h2', () => {
		const { container } = renderWith('1 cup flour', [null]);
		expect(container.querySelector('section#ingredients')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 2, name: 'Ingredients' })).toBeInTheDocument();
	});

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

	test('sets the weight apart in the muted tone', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false }]);
		const accent = screen.getByText('(125g)');
		expect(accent).toHaveClass('text-text-3');
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

	test('the measure is bold even when no weight is known', () => {
		renderWith('1 cup flour', [null]);
		expect(screen.getByText('1 cup')).toHaveClass('font-semibold');
	});

	test('a check-off row shows the focus ring on the row, not the hidden box', () => {
		renderWith('1 cup flour', [null]);
		expect(rows()[0]).toHaveClass('has-[:focus-visible]:outline-2');
	});

	test('each row starts with a visible square that is the picture of its checkbox', () => {
		renderWith('1 cup flour', [null]);
		const row = rows()[0];
		const box = screen.getByRole('checkbox');
		const tick = row.querySelector('.tick')!;
		// The input stays native and hidden; the square only draws its state.
		expect(box).toHaveClass('sr-only');
		expect(tick).toHaveAttribute('aria-hidden', 'true');
		expect(tick).toHaveClass('group-has-[:checked]:bg-accent');
		expect(box.nextElementSibling).toBe(tick);
		expect(
			tick.compareDocumentPosition(screen.getByText('1 cup')) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('the square is drawn in Ink 3, and a ticked row dims its text, not the square', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false }]);
		const row = rows()[0];
		const tick = row.querySelector('.tick')!;
		// Rule 2 was 1.35:1 on the paper; a control's edge needs 3:1.
		expect(tick).toHaveClass('border-text-3');
		expect(tick).not.toHaveClass('border-border-2');
		// The dim on the row would turn the clay fill salmon: it sits on the text,
		// grams included, so the checked square stays full clay.
		expect(row.className).not.toContain('opacity-60');
		expect(tick.nextElementSibling).toHaveClass('group-has-[:checked]:opacity-60');
		expect(tick.nextElementSibling).toHaveTextContent('1 cup (125g) flour');
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

	test('restores the ticks saved for this version, and saves each new one', async () => {
		saveTicks(KEY, [1]);
		renderWith(LINES, [null, null, null]);
		const boxes = screen.getAllByRole('checkbox');
		await vi.waitFor(() => expect(boxes[1]).toBeChecked());
		expect(boxes[0]).not.toBeChecked();
		await fireEvent.click(boxes[0]);
		expect(loadTicks(KEY)).toEqual([1, 0]);
		await fireEvent.click(boxes[1]);
		expect(loadTicks(KEY)).toEqual([0]);
		localStorage.clear();
	});
});
