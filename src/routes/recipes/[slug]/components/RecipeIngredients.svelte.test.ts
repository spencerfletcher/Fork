import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import RecipeIngredients from './RecipeIngredients.svelte';
import { WEIGHED_NOTE } from '#lib/measurement.js';
import source from './RecipeIngredients.svelte?raw';
import { readFileSync } from 'node:fs';
import { ticksKey, loadTicks, saveTicks } from './ticks';
import { FRACTIONS, SCALED_NOTES } from '#lib/recipes/scale.js';
import { cssRules } from '#lib/testing/css.js';

type GramResult = {
	grams: number;
	grams2: number | null;
	approximate: boolean;
	likeWater: boolean;
} | null;

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
	test('a line breaks a long unbroken word, so a phone never scrolls sideways', () => {
		renderWith('salt to taste', [null]);
		expect(rows()[0].lastElementChild).toHaveTextContent('salt to taste');
		expect(rows()[0].lastElementChild).toHaveClass('min-w-0', '[overflow-wrap:anywhere]');
	});

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
			{ grams: 281, grams2: null, approximate: false, likeWater: false },
			{ grams: 100, grams2: null, approximate: true, likeWater: false },
			null
		]);
		expect(rows()[0]).toHaveTextContent('2¼ cups (281g) all-purpose flour');
		expect(rows()[1]).toHaveTextContent('2 large eggs (≈100g)');
		expect(rows()[2]).toHaveTextContent('salt to taste');
		expect(screen.getByText(/estimates/i)).toBeInTheDocument();
	});

	test('sets the weight apart in the muted tone', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false, likeWater: false }]);
		const accent = screen.getByText('(125g)');
		expect(accent).toHaveClass('text-text-3');
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});

	test('rounds to 0.1g below ten grams and to whole grams above', () => {
		renderWith('1 tsp salt\n1 cup flour', [
			{ grams: 5.6789, grams2: null, approximate: false, likeWater: false },
			{ grams: 125.4, grams2: null, approximate: false, likeWater: false }
		]);
		expect(screen.getByText('(5.7g)')).toBeInTheDocument();
		expect(screen.getByText('(125g)')).toBeInTheDocument();
	});

	test('shows both ends of a range', () => {
		renderWith('1-2 cups water\n2-3 eggs', [
			{ grams: 240, grams2: 480, approximate: false, likeWater: false },
			{ grams: 100, grams2: 150, approximate: true, likeWater: false }
		]);
		expect(rows()[0]).toHaveTextContent('1-2 cups (240–480g) water');
		expect(rows()[1]).toHaveTextContent('2-3 eggs (≈100–150g)');
	});

	test('explains that a counted weight is a typical whole-item weight', () => {
		renderWith('2 eggs', [{ grams: 100, grams2: null, approximate: true, likeWater: false }]);
		expect(screen.getByText('(≈100g)')).toHaveAttribute('title', expect.stringMatching(/typical/i));
	});

	test('shows no estimate note when nothing shown is approximate', () => {
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false, likeWater: false }]);
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
		renderWith('1 cup flour', [{ grams: 125, grams2: null, approximate: false, likeWater: false }]);
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
		const bodies = (selector: string) => cssRules(appCss, selector);

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
					{ grams: 281, grams2: null, approximate: false, likeWater: false },
					{ grams: 100, grams2: null, approximate: true, likeWater: false },
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
		renderWith('½ onion', [{ grams: 55, grams2: null, approximate: true, likeWater: false }]);
		expect(rows()[0].querySelector('.font-semibold')).toHaveTextContent('½ onion');
		expect(rows()[0]).toHaveTextContent('½ onion (≈55g)');
	});

	// The rule is the heading's own border, as Method's is, so below 1024,
	// where the tabs stand in for the h2s and hide them, no empty rule is left.
	test('the one rule is the heading’s own border, with no wrapper row', () => {
		renderWith(LINES, [null, null, null]);
		const heading = screen.getByRole('heading', { name: 'Ingredients' });
		expect(heading).toHaveClass('border-b');
		expect(heading.parentElement!.tagName).toBe('SECTION');
	});

	// Spencer: scaled items in the accent "to show that it's an estimate".
	test('at a multiplier the rows scaling changed read clay, measure and weight; the rest stay', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [{ grams: 281, grams2: null, approximate: false, likeWater: false }, null, null],
				storageKey: KEY,
				factor: 2
			}
		});
		const [flour, eggs, salt] = rows();
		expect(flour.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(screen.getByText('(562g)')).toHaveClass('text-accent');
		expect(eggs.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(salt.querySelector('.text-accent')).toBeNull();
		expect(screen.getByText(SCALED_NOTES.plain)).toHaveClass('form-hint');
	});

	test('unscaled, nothing is clay and there is no estimate note', () => {
		renderWith(LINES, [
			{ grams: 281, grams2: null, approximate: false, likeWater: false },
			null,
			null
		]);
		expect(document.querySelector('label .text-accent')).toBeNull();
		expect(screen.queryByText(/not scaled/)).toBeNull();
	});

	test('scaled with whole-item weights, one note says both', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(LINES),
				grams: [null, { grams: 100, grams2: null, approximate: true, likeWater: false }, null],
				storageKey: KEY,
				factor: 2
			}
		});
		expect(screen.getByText(SCALED_NOTES.weights)).toBeInTheDocument();
		expect(screen.queryByText('Whole-item weights are estimates, not exact.')).toBeNull();
	});

	// Pans and ovens are in the method, not the list, so the notice holds
	// whenever the recipe is scaled, even with no line rewritten.
	test('scaled with no line it could rewrite, the notice still shows', () => {
		render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText('salt to taste'),
				grams: [null],
				storageKey: KEY,
				factor: 2
			}
		});
		expect(screen.getByText(SCALED_NOTES.plain)).toHaveClass('form-hint');
	});
});

describe('RecipeIngredients groups', () => {
	const GROUPED = 'salt\n# Dough\n2 cups flour\n2 large eggs\n# Icing\n1 cup sugar';

	test('a group name heads its run of rows, in the serif, ink; rows before the first have none', () => {
		const { container } = renderWith(GROUPED, [null, null, null, null]);
		const headings = screen.getAllByRole('heading', { level: 3 });
		expect(headings.map((h) => h.textContent!.trim())).toEqual(['Dough', 'Icing']);
		for (const h of headings) {
			expect(h).toHaveClass('font-serif', 'text-text');
			expect(h).not.toHaveClass('text-accent');
		}
		// Document order: salt, Dough, flour, eggs, Icing, sugar.
		const order = [...container.querySelectorAll('h3, label')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(order).toEqual([
			'salt',
			'Dough',
			'2 cups flour',
			'2 large eggs',
			'Icing',
			'1 cup sugar'
		]);
	});

	test('ticks stay one per row, keyed by position across groups', () => {
		renderWith(GROUPED, [null, null, null, null]);
		const boxes = screen.getAllByRole('checkbox');
		expect(boxes).toHaveLength(4);
		fireEvent.click(boxes[3]);
		expect(loadTicks(KEY)).toEqual([3]);
	});

	test('an ungrouped list draws no group heading', () => {
		renderWith(LINES, [null, null, null]);
		expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
	});
});

describe('RecipeIngredients measurement', () => {
	const US = '2 cups milk\n8 oz cream cheese\n1/2 tsp salt\n2 large eggs\nsalt to taste';
	const US_GRAMS: GramResult[] = [
		{ grams: 480, grams2: null, approximate: false, likeWater: true },
		{ grams: 227, grams2: null, approximate: false, likeWater: false },
		null,
		{ grams: 100, grams2: null, approximate: true, likeWater: false },
		null
	];

	function renderIn(
		measurement: 'metric' | 'us' | null | undefined,
		text = US,
		grams = US_GRAMS,
		factor = 1
	) {
		return render(RecipeIngredients, {
			props: {
				ingredients: parseIngredientText(text),
				grams,
				storageKey: KEY,
				factor,
				...(measurement === undefined ? {} : { measurement })
			}
		});
	}

	const byText = (text: string) => screen.getByText((_, el) => el?.textContent === text);

	test('no preference (signed out, or As written) renders exactly what no prop renders', () => {
		const { container: without, unmount } = renderIn(undefined);
		const before = without.innerHTML;
		unmount();
		const { container: written } = renderIn(null);
		expect(written.innerHTML).toBe(before);
		expect(screen.queryByText(/Change in Settings/)).toBeNull();
	});

	test('metric: a US measure reads clay, the original in Ink 3 parentheses, spoons and counts as typed', () => {
		renderIn('metric');
		const [milk, cheese, salt, eggs] = rows();
		expect(milk).toHaveTextContent('475 ml written as (2 cups, 480g) milk');
		expect(milk.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(milk.querySelector('.font-semibold')).toHaveTextContent('475 ml');
		// A converted weight is grams already: no second gram figure.
		expect(cheese).toHaveTextContent('225 g written as (8 oz) cream cheese');
		const original = byText('written as (8 oz)');
		expect(original).toHaveClass('text-text-3');
		expect(original.querySelector('.sr-only')).toHaveTextContent('written as');
		expect(salt).toHaveTextContent('½ tsp salt');
		expect(salt.querySelector('.text-accent')).toBeNull();
		expect(eggs).toHaveTextContent('2 large eggs (≈100g)');
		expect(eggs.querySelector('.text-accent')).toBeNull();
	});

	test('a converted list says so once, with a link to Settings', () => {
		renderIn('metric');
		const notice = screen.getByText(/^Converted to metric/);
		expect(notice).toHaveTextContent(
			'Converted to metric; as written in parentheses. Change in Settings'
		);
		expect(notice).toHaveClass('form-hint');
		expect(screen.getByRole('link', { name: 'Change in Settings' })).toHaveAttribute(
			'href',
			'/settings#measurement-heading'
		);
	});

	test('US: a metric list converts', () => {
		renderIn('us', '250 g butter\n500 ml stock', [null, null]);
		expect(rows()[0]).toHaveTextContent('8¾ oz written as (250 g) butter');
		expect(rows()[1]).toHaveTextContent('2 cups written as (500 ml) stock');
		expect(screen.getByText(/^Converted to US units/)).toBeInTheDocument();
	});

	test('US: a US list is left as written, with no notice', () => {
		renderIn('us');
		expect(rows()[0]).toHaveTextContent('2 cups (480g) milk');
		expect(document.querySelector('label .text-accent')).toBeNull();
		expect(screen.queryByText(/^Converted to/)).toBeNull();
	});

	test('scaled then converted: the original is the scaled measure, clay like the scaled weight', () => {
		renderIn(
			'metric',
			'1 cup milk',
			[{ grams: 240, grams2: null, approximate: false, likeWater: true }],
			2
		);
		expect(rows()[0]).toHaveTextContent('475 ml written as (2 cups, 480g) milk');
		expect(byText('written as (2 cups, 480g)')).toHaveClass('text-accent');
	});

	test('metric: a dry ingredient in cups leads with grams in clay, the cups written as, one gram figure', () => {
		const flour = { grams: 281.6, grams2: null, approximate: false, likeWater: false };
		renderIn('metric', '2¼ cups all-purpose flour', [flour]);
		const [row] = rows();
		expect(row).toHaveTextContent('280 g written as (2¼ cups) all-purpose flour');
		expect(row.textContent).not.toMatch(/\dg\b/);
		expect(row.querySelector('.font-semibold')).toHaveTextContent('280 g');
		expect(row.querySelector('.font-semibold')).toHaveClass('text-accent');
		expect(byText('written as (2¼ cups)').querySelector('.sr-only')).toHaveTextContent(
			'written as'
		);
		expect(screen.getByText(/^Converted to metric/)).toHaveTextContent(
			`Converted to metric; as written in parentheses. ${WEIGHED_NOTE} Change in Settings`
		);
	});

	test('the weights line is there only when a row led with grams', () => {
		renderIn('metric');
		expect(screen.queryByText(new RegExp(WEIGHED_NOTE))).toBeNull();
	});

	test('a ticked converted row recedes to Ink 3 like the rest', () => {
		renderIn('metric');
		expect(rows()[0].querySelector('.font-semibold')).toHaveClass(
			'group-has-[:checked]:text-text-3'
		);
	});
});
