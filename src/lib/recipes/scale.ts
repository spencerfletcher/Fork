// Serving scaling on the recipe page: a multiplier applied at render time.
// Nothing here is saved; the stored line stays the source of truth and is
// what shows at the recipe's own serves.
import { unitsOfMeasure } from 'parse-ingredient';
import type { Ingredient } from './types.js';
import type { GramResult } from '#lib/server/ingredientDensities.js';

/** The smallest serves the box accepts, typed or reached by halving. */
export const MIN_SERVES = 0.25;

/** "1/2" and its kin as the glyphs a cookbook sets. */
export const FRACTIONS: Record<string, string> = {
	'1/2': '½',
	'1/3': '⅓',
	'2/3': '⅔',
	'1/4': '¼',
	'3/4': '¾',
	'1/8': '⅛',
	'3/8': '⅜',
	'5/8': '⅝',
	'7/8': '⅞'
};

// Smallest first, so 2/4 is found as 1/2. A value within a hundredth of one
// of these reads as it, which also swallows float noise from the multiply.
const DENOMINATORS = [2, 3, 4, 8];
const TOLERANCE = 0.01;

export function scaleQuantity(quantity: number | null, factor: number): number | null {
	return quantity === null ? null : quantity * factor;
}

/** A clean half, third, quarter or eighth as its glyph ("4½"), anything else to one decimal. */
export function formatScaled(n: number): string {
	const whole = Math.floor(n);
	const fraction = n - whole;
	for (const d of DENOMINATORS) {
		const numerator = Math.round(fraction * d);
		if (numerator > 0 && numerator < d && Math.abs(fraction - numerator / d) < TOLERANCE) {
			return `${whole || ''}${FRACTIONS[`${numerator}/${d}`]}`;
		}
	}
	const tenths = Math.round(n * 10) / 10;
	return tenths > 0 ? String(tenths) : n.toFixed(2);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Servings to at most two decimals, trailing zeros trimmed. */
export function formatServes(n: number): string {
	return String(round2(n));
}

/** A typed or ?serves= value; anything that is not a plain decimal of at least MIN_SERVES leaves `fallback`. */
export function parseServes(value: string | null, fallback: number): number {
	const text = value?.trim().replace(',', '.') ?? '';
	if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return fallback;
	const n = round2(Number(text));
	return n >= MIN_SERVES ? n : fallback;
}

// A full-word unit follows the quantity: "1 cup", "2 cups". Abbreviations
// ("tsp", "g") have no plural and pass through.
function unitFor(unit: string, quantity: number): string {
	for (const [singular, { plural }] of Object.entries(unitsOfMeasure)) {
		if (unit === singular || unit === plural) return quantity > 1 ? plural : singular;
	}
	return unit;
}

/**
 * One row at a multiplier: the measure rewritten from the parsed quantity, the
 * gram estimate multiplied. The parser's own split finds the measure (the
 * text before the name, less the unit), so a number inside the name stays.
 * A row that did not parse, or whose name is not the end of its text ("zest
 * of 1 lemon"), comes back as it was, grams included.
 */
export function scaleIngredient(
	ingredient: Ingredient,
	grams: GramResult | null,
	factor: number
): { ingredient: Ingredient; grams: GramResult | null } {
	const unchanged = { ingredient, grams };
	const { text, name, unit } = ingredient;
	const quantity = scaleQuantity(ingredient.quantity, factor);
	if (factor === 1 || quantity === null || !text.endsWith(name)) return unchanged;

	const prefix = text.slice(0, text.length - name.length);
	const at = unit ? prefix.indexOf(unit) : prefix.length;
	if (at < 0) return unchanged;

	const quantity2 = scaleQuantity(ingredient.quantity2, factor);
	const measure =
		formatScaled(quantity) + (quantity2 === null ? '' : `–${formatScaled(quantity2)}`);
	const shownUnit = unit && unitFor(unit, quantity2 ?? quantity);
	const between = prefix.slice(at + unit.length).trim();
	return {
		ingredient: {
			...ingredient,
			quantity,
			quantity2,
			unit: shownUnit,
			text: [measure, shownUnit, between, name].filter(Boolean).join(' ')
		},
		grams: grams && {
			...grams,
			grams: grams.grams * factor,
			grams2: grams.grams2 === null ? null : grams.grams2 * factor
		}
	};
}
