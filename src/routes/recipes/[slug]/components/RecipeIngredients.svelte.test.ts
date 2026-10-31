import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';
import source from './RecipeIngredients.svelte?raw';
import { readFileSync } from 'node:fs';
import { ticksKey, loadTicks, saveTicks } from './ticks';
import { FRACTIONS } from '#lib/recipes/scale.js';

type GramResult = { grams: number; grams2: number | null; approximate: boolean } | null;

const KEY = ticksKey('my-fork', 3, 'ingredients');
const appCss = readFileSync('src/app.css', 'utf8');

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

	test('each row starts with a visible circle that is the picture of its checkbox', () => {
		renderWith('1 cup flour', [null]);
		const row = rows()[0];
		const box = screen.getByRole('checkbox');
		const tick = row.querySelector('.tick')!;
		// The input stays native and hidden; the circle only draws its state,
		// painted by the shared .tick rules in app.css, not by its own classes.
		expect(box).toHaveClass('sr-only');
		expect(tick).toHaveAttribute('aria-hidden', 'true');
		expect(tick.className).not.toMatch(/border-|bg-|rounded|size-/);
		expect(box.nextElementSibling).toBe(tick);
		expect(
			tick.compareDocumentPosition(screen.getByText('1 cup')) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('a ticked row turns its text Ink 3, grams included, and keeps its strike', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false }]);
		const row = rows()[0];
		const tick = row.querySelector('.tick')!;
		// Ink 3 on the text, grams included (already Ink 3), 4.9:1 on paper; an
		// opacity dim fell under 4.5:1 and would wash out the marigold fill.
		expect(row.outerHTML).not.toContain('opacity');
		expect(row).toHaveClass('has-[:checked]:line-through');
		expect(tick.nextElementSibling).toHaveClass('group-has-[:checked]:text-text-3');
		expect(tick.nextElementSibling).toHaveTextContent('1 cup (125g) flour');
	});

	test('the tick is styled once, in app.css, not in the component', () => {
		expect(source).not.toMatch(/<style>/);
	});

	// Both lists share these rules; they are pinned here once.
	describe('the shared .tick rules in app.css', () => {
		const rule = (selector: string) => {
			const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			return new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g');
		};
		const bodies = (selector: string) => [...appCss.matchAll(rule(selector))].map((m) => m[1]);

		test('at rest a 16px circle with a 1px Ink 3 edge', () => {
			const [rest] = bodies('.tick');
			expect(rest).toMatch(/width: 16px;/);
			expect(rest).toMatch(/height: 16px;/);
			expect(rest).toMatch(/border-radius: 50%;/);
			expect(rest).toMatch(/border: 1px solid var\(--color-text-3\);/);
		});

		test('hovering the row turns the edge Ink 2', () => {
			expect(bodies('label:hover .tick')[0]).toMatch(/border-color: var\(--color-text-2\);/);
		});

		test('ticked, it fills marigold and draws an ink check', () => {
			const [fill] = bodies('label:has(:checked) .tick');
			expect(fill).toMatch(/background-color: var\(--color-marigold\);/);
			expect(fill).toMatch(/border-color: var\(--color-marigold\);/);
			expect(bodies('label:has(:checked) .tick::after')[0]).toMatch(
				/border-color: var\(--color-text\);/
			);
		});

		test('in forced colours the circle keeps its own paint, so a tick still shows', () => {
			expect(appCss).toMatch(
				/@media \(forced-colors: active\)\s*\{\s*\.tick\s*\{[^}]*forced-color-adjust: none;[^}]*border-color: CanvasText;/
			);
			expect(appCss).toMatch(/label:has\(:checked\) \.tick\s*\{[^}]*background-color: Highlight;/);
			expect(appCss).toMatch(
				/label:has\(:checked\) \.tick::after\s*\{[^}]*border-color: HighlightText;/
			);
		});
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

	test('Clear ticks shows only once a line is ticked, and clears the list and its saved ticks', async () => {
		renderWith(LINES, [null, null, null]);
		expect(screen.queryByRole('button', { name: 'Clear ticks' })).toBeNull();
		await fireEvent.click(rows()[0]);
		await fireEvent.click(rows()[2]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }));
		for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeChecked();
		expect(loadTicks(KEY)).toEqual([]);
		expect(screen.queryByRole('button', { name: 'Clear ticks' })).toBeNull();
	});

	test('Clear ticks hands keyboard focus to the first line as it goes', async () => {
		renderWith(LINES, [null, null, null]);
		await fireEvent.click(rows()[2]);
		const button = screen.getByRole('button', { name: 'Clear ticks' });
		button.focus();
		await fireEvent.click(button);
		expect(document.activeElement).toBe(screen.getAllByRole('checkbox')[0]);
	});

	// A mouse click (detail 1) must not scroll the page to the first line;
	// Enter or Space (detail 0) may, so the keyboard user sees where focus went.
	test('Clear ticks from a mouse moves focus without scrolling; from the keyboard it scrolls', async () => {
		const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
		renderWith(LINES, [null, null, null]);
		await fireEvent.click(rows()[2]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }), { detail: 1 });
		expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
		expect(document.activeElement).toBe(screen.getAllByRole('checkbox')[0]);

		await fireEvent.click(screen.getAllByRole('checkbox')[1]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }), { detail: 0 });
		expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
		expect(document.activeElement).toBe(screen.getAllByRole('checkbox')[0]);
		focus.mockRestore();
	});

	test('sets typed eighths past ⅛ as their glyphs too', () => {
		renderWith('3/8 tsp salt', [null]);
		expect(rows()[0]).toHaveTextContent(`${FRACTIONS['3/8']} tsp salt`);
	});

	test('at a multiplier, measures and weights scale; a line without a number stays as typed', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [
					{ grams: 281, grams2: null, approximate: false },
					{ grams: 100, grams2: null, approximate: true },
					null
				],
				storageKey: KEY,
				factor: 2
			}
		});
		expect(rows()[0]).toHaveTextContent(`4${FRACTIONS['1/2']} cups (562g) all-purpose flour`);
		expect(rows()[0].querySelector('.font-semibold')).toHaveTextContent(
			`4${FRACTIONS['1/2']} cups`
		);
		expect(rows()[1]).toHaveTextContent('4 large eggs (≈200g)');
		expect(rows()[2]).toHaveTextContent('salt to taste');
	});

	test('a counted line that opens on a fraction glyph is bold whole, its weight trailing', () => {
		renderWith('½ onion', [{ grams: 55, grams2: null, approximate: true }]);
		expect(rows()[0].querySelector('.font-semibold')).toHaveTextContent('½ onion');
		expect(rows()[0]).toHaveTextContent('½ onion (≈55g)');
	});

	test('a control sits in the eyebrow row after the heading, both above the one rule', () => {
		const control = createRawSnippet(() => ({
			render: () => '<span class="control">control</span>'
		}));
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [null, null, null],
				storageKey: KEY,
				control
			}
		});
		const heading = screen.getByRole('heading', { name: 'Ingredients' });
		const row = heading.parentElement!;
		expect(row).toContainElement(screen.getByText('control'));
		expect(heading.nextElementSibling).toHaveTextContent('control');
		expect(row).toHaveClass('border-b');
		expect(heading).not.toHaveClass('border-b');
	});

	// Spencer: scaled items in the accent "to show that it's an estimate".
	test('at a multiplier the rows scaling changed read clay, measure and weight; the rest stay', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [{ grams: 281, grams2: null, approximate: false }, null, null],
				storageKey: KEY,
				factor: 2
			}
		});
		const [flour, eggs, salt] = rows();
		expect(flour.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(screen.getByText('(562g)')).toHaveClass('text-accent');
		expect(eggs.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(salt.querySelector('.text-accent')).toBeNull();
		expect(screen.getByText('Scaled quantities are estimates.')).toHaveClass('form-hint');
	});

	test('unscaled, nothing is clay and there is no estimate note', () => {
		renderWith(LINES, [{ grams: 281, grams2: null, approximate: false }, null, null]);
		expect(document.querySelector('label .text-accent')).toBeNull();
		expect(screen.queryByText(/Scaled quantities/)).toBeNull();
	});

	test('scaled with whole-item weights, one note says both', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [null, { grams: 100, grams2: null, approximate: true }, null],
				storageKey: KEY,
				factor: 2
			}
		});
		expect(
			screen.getByText('Scaled quantities and whole-item weights are estimates.')
		).toBeInTheDocument();
		expect(screen.queryByText('Whole-item weights are estimates, not exact.')).toBeNull();
	});
});
