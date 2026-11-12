// Serving scaling on the recipe page: a multiplier applied at render time.
// Nothing here is saved; the stored line stays the source of truth and is
// what shows at the recipe's own serves.
import { unitsOfMeasure } from 'parse-ingredient';
import pluralize from 'pluralize';
import type { Ingredient, RecipeContent } from './types.js';
import type { GramResult } from '#lib/server/ingredientDensities.js';

/** The furthest a recipe scales either way: a hundred times its batch, or a hundredth of it. */
export const MAX_SCALE = 100;

/** The scaler's hint under its field. A bare "1/2" is half a serving, not
 *  half the recipe, so the hint's halving example carries its x. */
export const SCALE_HINT = 'A number, or a scale: 2x, 1/2x, 50%';

/** Why a typed scale is refused, in the words the scaler shows. */
export const SCALE_MESSAGES = {
	unreadable: `Write ${SCALE_HINT.charAt(0).toLowerCase()}${SCALE_HINT.slice(1)}`,
	zero: 'A scale can’t be zero',
	negative: 'A scale can’t be negative',
	outOfRange: `Scale between ${1 / MAX_SCALE}x and ${MAX_SCALE}x`
} as const;

export type ScaleRead =
	{ ok: true; factor: number } | { ok: false; reason: keyof typeof SCALE_MESSAGES };

/** The owner's sentence, the core of the note shown while a recipe is scaled. */
export const NOT_SCALED = 'Pan sizes and oven temperatures are not scaled';

/** The one note under a scaled list: with whole-item weights on it, or without. */
export const SCALED_NOTES = {
	plain: `${NOT_SCALED}, and scaled quantities are estimates.`,
	weights: `${NOT_SCALED}, and scaled quantities and whole-item weights are estimates.`
} as const;

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
	return decimal(n, 1);
}

/** `n` to `places` decimals, trailing zeros trimmed; too small for that, one
 *  significant digit written out in full, so a positive quantity stays
 *  positive whatever its unit (0.0005 kg is half a gram), and never "1e-7". */
function decimal(n: number, places: number): string {
	const rounded = Math.round(n * 10 ** places) / 10 ** places;
	if (rounded > 0) return String(rounded);
	if (n <= 0) return '0';
	return n.toFixed(-Math.floor(Math.log10(n)));
}

// A scaled metric quantity is read off a scale or a jug, so it has no
// fractions: whole grams and millilitres (one decimal under 1), kilograms,
// litres and decilitres to two places. By parse-ingredient's unit id.
const METRIC_PLACES: Record<string, number> = {
	milligram: 0,
	gram: 0,
	milliliter: 0,
	deciliter: 2,
	kilogram: 2,
	liter: 2
};

/** The stored unit as typed ("cups", "Tbsp", "T", "mL") to parse-ingredient's
 *  id: exact first, so "T" (tablespoon) and "t" (teaspoon) stay apart, then ignoring case. */
export function unitOfMeasure(unit: string): string | undefined {
	const find = (u: string) =>
		Object.entries(unitsOfMeasure).find(
			([id, d]) => id === u || d.short === u || d.plural === u || !!d.alternates?.includes(u)
		)?.[0];
	return find(unit) ?? find(unit.toLowerCase());
}

/** A scaled quantity in its unit: metric without fractions, else formatScaled. */
function formatIn(unit: string, n: number): string {
	const places = METRIC_PLACES[unitOfMeasure(unit) ?? ''];
	if (places === undefined) return formatScaled(n);
	return decimal(n, n < 1 ? Math.max(places, 1) : places);
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
		formatIn(unit, quantity) + (quantity2 === null ? '' : `–${formatIn(unit, quantity2)}`);
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

const hasMeasure = (makes: string) =>
	[DIMENSION, TEMPERATURE, RANGE].some((pattern) => pattern.test(makes));

// The one count a yield leads with ("about 12" of "about 12 buns"), split
// around it; null for no leading number, or a size, temperature or range.
function leadingCount(makes: string): { before: string; value: number; after: string } | null {
	const match = hasMeasure(makes) ? null : LEADING.exec(makes);
	const value = match ? leadingValue(match[2]) : NaN;
	if (!match || !Number.isFinite(value) || value <= 0) return null;
	return { before: match[1] ?? '', value, after: makes.slice(match[0].length) };
}

// Words that count rather than name ("2 dozen cookies"), and the words that end
// a yield's noun phrase ("loaves of bread", "rolls, about 80 g each").
const COUNT_WORDS = new Set(['dozen', 'score', 'hundred', 'thousand']);
const PHRASE_END = new Set(['of', 'for', 'with', 'to', 'in', 'each', 'per', 'and', 'or', 'about']);
const WORD = /^(?:\d+-)?[A-Za-z][A-Za-z'-]*$/;
// parse-ingredient's sizes ("1 large egg") are adjectives in a yield ("12 large rolls").
const SIZES = new Set(['small', 'medium', 'large']);
// pluralize reads "-ies" as "-y" ("cookies" → "cooky"): the food nouns it gets wrong.
for (const noun of ['cookie', 'brownie', 'blondie', 'smoothie', 'hoagie', 'quiche']) {
	pluralize.addIrregularRule(noun, `${noun}s`);
}

/**
 * The words after a yield's count with the head noun (the last word of the
 * phrase before "of", a comma or the end) singular at a count of one or less,
 * else plural: "loaf" at 2 is "2 loaves", "36 cookies" at 1 "1 cookie", "½ loaf",
 * "1½ loaves". A unit or abbreviation first ("1.8 L", "500 ml sauce"), a count
 * word ("dozen") or a noun pluralize cannot read is left as typed.
 * ponytail: English only (pluralize's rules), and a phrase whose head is not
 * its last plain word ("2 pies, 9-inch") stays as typed; a per-language table if yields go multilingual.
 */
function inflectHead(after: string, count: number): string {
	const words = after.split(/(\s+|,)/);
	let head = -1;
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		if (word === '' || /^\s+$/.test(word)) continue;
		if (!WORD.test(word) || PHRASE_END.has(word.toLowerCase())) break;
		const unit = unitOfMeasure(word);
		if (head === -1 && ((unit && !SIZES.has(unit)) || word === word.toUpperCase())) return after;
		if (COUNT_WORDS.has(word.toLowerCase())) return after;
		head = i;
	}
	if (head === -1 || /^\d/.test(words[head])) return after;
	// Rounded as formatScaled shows it, so a count that reads "1" is one.
	words[head] = pluralize(words[head], Math.round(count * 10) / 10 > 1 ? 2 : 1);
	return words.join('');
}

export type MakesScaled = { text: string; scaled: boolean; flagged: boolean };

/**
 * A yield at a serving multiplier: its leading number scaled ("12 buns" at
 * ×1.5 is "18 buns"), never the servings read from it. Text with a size,
 * temperature or range is left as typed and flagged, so the page can say it
 * was not scaled; text with no leading number ("a dozen") is left as typed,
 * unflagged.
 */
export function scaleMakes(makes: string, factor: number): MakesScaled {
	const unchanged = { text: makes, scaled: false, flagged: false };
	if (factor === 1) return unchanged;
	if (hasMeasure(makes)) return { ...unchanged, flagged: true };
	const count = leadingCount(makes);
	if (!count) return unchanged;
	const scaled = count.value * factor;
	const text = count.before + formatScaled(scaled) + inflectHead(count.after, scaled);
	return { text, scaled: true, flagged: false };
}

// A number as typed: "6", "1.5", ".5", "1/2", "1 1/2", "½", "1½", "1 ½".
const NUMBER = `\\d+ \\d+/\\d+|\\d+ ?[${GLYPHS}]|\\d+/\\d+|\\d*\\.\\d+|\\d+\\.?|[${GLYPHS}]`;
const BARE = new RegExp(`^(${NUMBER})$`);
const TIMES = new RegExp(`^(?:[x×] ?(${NUMBER})|(${NUMBER}) ?[x×])$`);
const PERCENT = new RegExp(`^(${NUMBER}) ?%$`);

function factorOf(text: string, base: number): number | null {
	const percent = PERCENT.exec(text);
	if (percent) return leadingValue(percent[1]) / 100;
	const times = TIMES.exec(text);
	if (times) return leadingValue(times[1] ?? times[2]);
	const bare = BARE.exec(text);
	return bare ? leadingValue(bare[1]) / base : null;
}

/**
 * A typed scale as a multiplier, or why not. A bare number is a count in
 * the box's units, so it divides by `base`, the recipe's own count ("6" on a
 * recipe for 4 is ×1.5; "0.5" and "1/2" are half a serving); a number with
 * x or × either side, or a percentage, is the multiplier itself. Fraction
 * glyphs and a decimal comma read too. Zero, a minus sign, and anything past
 * MAX_SCALE either way are refused.
 */
export function readScale(typed: string, base: number): ScaleRead {
	const text = typed
		.trim()
		.toLowerCase()
		.replace(/(\d),(\d)/g, '$1.$2')
		.replace(/\s+/g, ' ');
	const unsigned = text.replace(/^[-−] ?/, '');
	const factor = factorOf(unsigned, base);
	if (factor === null || !Number.isFinite(factor)) return { ok: false, reason: 'unreadable' };
	if (unsigned !== text) return { ok: false, reason: 'negative' };
	if (factor === 0) return { ok: false, reason: 'zero' };
	if (factor > MAX_SCALE || factor < 1 / MAX_SCALE) return { ok: false, reason: 'outOfRange' };
	return { ok: true, factor };
}

type Yield = Pick<RecipeContent, 'servings' | 'makes'>;

/** What the scaler counts, which is also the URL param that carries it. */
export type ScaleBy = 'serves' | 'makes' | 'scale';

// The scaler's units and its 1x: the servings; else the count Makes leads
// with; else (a Makes with no single count) the multiplier itself.
function scaleBase({ servings, makes }: Yield): { by: ScaleBy; base: number; unit: string } | null {
	if (servings) return { by: 'serves', base: servings, unit: '' };
	if (!makes) return null;
	const count = leadingCount(makes);
	if (!count) return { by: 'scale', base: 1, unit: 'x' };
	return { by: 'makes', base: count.value, unit: count.after.trim() };
}

/** The count a link asks for (`?serves=`, `?makes=` or `?scale=`, whichever
 *  is this recipe's), to two decimals; null when absent or refused. */
export function linkedCount(content: Yield, params: Pick<URLSearchParams, 'get'>): number | null {
	const at = scaleBase(content);
	const typed = at && params.get(at.by);
	if (!at || typed === null) return null;
	const read = readScale(typed, at.base);
	return read.ok ? round2(read.factor * at.base) : null;
}

export type Scaling = {
	by: ScaleBy;
	/** The recipe's own count in the scaler's units: its 1x. */
	base: number;
	/** The count it is scaled to; `base` unscaled. */
	count: number;
	factor: number;
	scaled: boolean;
	/** The words the count is of: "servings", the Makes noun ("cookies"), or "x". */
	unit: string;
	/** The scaled Serves as shown, null without servings. */
	serves: string | null;
	makes: MakesScaled | null;
};

/** A recipe at a count in its scaler's units (null: as stored), or null when
 *  it has neither Serves nor Makes to scale. Serves drives and Makes follows. */
export function scaling(content: Yield, count: number | null): Scaling | null {
	const at = scaleBase(content);
	if (!at) return null;
	const { by, base } = at;
	const shown = count ?? base;
	const factor = shown / base;
	return {
		by,
		base,
		count: shown,
		factor,
		scaled: factor !== 1,
		unit:
			by === 'serves'
				? shown === 1
					? 'serving'
					: 'servings'
				: by === 'makes' && factor !== 1
					? inflectHead(at.unit, shown)
					: at.unit,
		serves: by === 'serves' ? formatServes(shown) : null,
		makes: content.makes ? scaleMakes(content.makes, factor) : null
	};
}
