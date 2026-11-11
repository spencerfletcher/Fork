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
	if (tenths > 0) return String(tenths);
	if (n <= 0) return '0';
	// Under a tenth, one significant digit written out in full: a positive quantity
	// stays positive whatever its unit (0.0005 kg is half a gram), and never "1e-7".
	return n.toFixed(-Math.floor(Math.log10(n)));
}

/** A gram estimate as the list shows it: whole grams, a tenth below ten, and
 *  under a twentieth one significant digit (0.02g), never 0g. */
export function formatGrams({ grams, grams2, approximate }: GramResult): string {
	const round = (g: number) =>
		g < 10 ? Math.round(g * 10) / 10 || formatScaled(g) : Math.round(g);
	const range = grams2 === null ? '' : `–${round(grams2)}`;
	return `${approximate ? '≈' : ''}${round(grams)}${range}g`;
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
export function unitFor(unit: string, quantity: number): string {
	for (const [singular, { plural }] of Object.entries(unitsOfMeasure)) {
		if (unit === singular || unit === plural) return quantity > 1 ? plural : singular;
	}
	return unit;
}

/**
 * The parser's own split of a typed line: the measure (number and unit, as
 * typed) and any words between the unit and the name. Null when the name is
 * not the end of the text ("zest of 1 lemon") or the unit is not in it, so
 * the line cannot be rewritten.
 */
export function splitMeasure({ text, name, unit }: Ingredient): {
	measure: string;
	between: string;
} | null {
	if (!text.endsWith(name)) return null;
	const prefix = text.slice(0, text.length - name.length);
	const at = unit ? prefix.indexOf(unit) : prefix.length;
	if (at < 0) return null;
	return {
		measure: prefix.slice(0, at + unit.length).trim(),
		between: prefix.slice(at + unit.length).trim()
	};
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
	const { name, unit } = ingredient;
	const quantity = scaleQuantity(ingredient.quantity, factor);
	const split = splitMeasure(ingredient);
	if (factor === 1 || quantity === null || split === null) return unchanged;

	const quantity2 = scaleQuantity(ingredient.quantity2, factor);
	const measure =
		formatScaled(quantity) + (quantity2 === null ? '' : `–${formatScaled(quantity2)}`);
	const shownUnit = unit && unitFor(unit, quantity2 ?? quantity);
	const { between } = split;
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

// A yield's size, temperature or range ("one 9x13 pan", "at 180°C", "12-14
// buns") is not one count, so it is never multiplied; the page says so.
const DIMENSION = /\d\s*[x×]\s*\d/;
const TEMPERATURE = /°|\d\s*[FC]\b/;
const RANGE = /\d\s*[-–]\s*\d/;
const GLYPHS = Object.values(FRACTIONS).join('');
const GLYPH_VALUE: Record<string, number> = Object.fromEntries(
	Object.entries(FRACTIONS).map(([fraction, glyph]) => {
		const [numerator, denominator] = fraction.split('/').map(Number);
		return [glyph, numerator / denominator];
	})
);
// One leading number, optionally "about" or "≈" first: "12", "1.8", "1½",
// "½", "1/2", and the spaced mixed "1 1/2" and "1 ½", tried first so the
// whole number is not taken alone. A number run into more digits is not one.
const LEADING = new RegExp(
	`^(about\\s+|≈\\s*)?(\\d+\\s+\\d+/\\d+|\\d+\\s+[${GLYPHS}]|\\d+/\\d+|\\d+(?:\\.\\d+)?[${GLYPHS}]?|[${GLYPHS}])(?![\\d/.,–-])`,
	'i'
);

function leadingValue(number: string): number {
	const [whole, part] = number.split(/\s+/);
	if (part !== undefined) return Number(whole) + leadingValue(part);
	if (number.includes('/')) {
		const [numerator, denominator] = number.split('/').map(Number);
		return numerator / denominator;
	}
	const glyph = GLYPH_VALUE[number.at(-1)!];
	return glyph === undefined ? Number(number) : Number(number.slice(0, -1) || 0) + glyph;
}

/**
 * A yield at a serving multiplier: its leading number scaled ("12 buns" at
 * ×1.5 is "18 buns"), never the servings read from it. Text with a size,
 * temperature or range is left as typed and flagged, so the page can say it
 * was not scaled; text with no leading number ("a dozen") is left as typed,
 * unflagged.
 */
export function scaleMakes(
	makes: string,
	factor: number
): { text: string; scaled: boolean; flagged: boolean } {
	const unchanged = { text: makes, scaled: false, flagged: false };
	if (factor === 1) return unchanged;
	if ([DIMENSION, TEMPERATURE, RANGE].some((pattern) => pattern.test(makes)))
		return { ...unchanged, flagged: true };
	const match = LEADING.exec(makes);
	if (!match) return unchanged;
	const value = leadingValue(match[2]);
	if (!Number.isFinite(value) || value <= 0) return unchanged;
	const text = (match[1] ?? '') + formatScaled(value * factor) + makes.slice(match[0].length);
	return { text, scaled: true, flagged: false };
}
