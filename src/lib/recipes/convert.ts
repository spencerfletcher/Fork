// Unit conversion on the recipe page: a cook's Settings preference (metric or
// US) applied at render time, after serving scaling. Nothing here is saved;
// the stored line stays the source of truth. A weight converts to a weight
// and a volume to a volume, except that Metric leads with the gram estimate
// for a volume of something weighed (flour, sugar, honey: not a likeWater), and
// only when the rounded result is within TOLERANCE of the true one.
import type { Ingredient } from './types.js';
import type { GramResult } from '#lib/server/ingredientDensities.js';
import type { Measurement } from '#lib/measurement.js';
import { formatScaled, splitMeasure, unitFor, unitOfMeasure } from './scale.js';

/**
 * The units that convert, by parse-ingredient's unit id: the system each
 * belongs to, what it measures, its size in grams or millilitres (US
 * customary for volumes: a 236.6 ml cup, not the 250 ml metric or imperial
 * one) and how it is written when converted to. Teaspoons and tablespoons are
 * kitchen-universal: a metric cookbook keeps them too, so they never convert
 * from, and are reached only as US sizes for a metric volume.
 */
export const UNITS = {
	milligram: { system: 'metric', dimension: 'mass', size: 0.001, shown: 'mg' },
	gram: { system: 'metric', dimension: 'mass', size: 1, shown: 'g' },
	kilogram: { system: 'metric', dimension: 'mass', size: 1000, shown: 'kg' },
	milliliter: { system: 'metric', dimension: 'volume', size: 1, shown: 'ml' },
	deciliter: { system: 'metric', dimension: 'volume', size: 100, shown: 'dl' },
	liter: { system: 'metric', dimension: 'volume', size: 1000, shown: 'L' },
	ounce: { system: 'us', dimension: 'mass', size: 28.349523, shown: 'oz' },
	pound: { system: 'us', dimension: 'mass', size: 453.59237, shown: 'lb' },
	teaspoon: { system: 'spoon', dimension: 'volume', size: 4.9289216, shown: 'tsp' },
	tablespoon: { system: 'spoon', dimension: 'volume', size: 14.786765, shown: 'tbsp' },
	'fluid ounce': { system: 'us', dimension: 'volume', size: 29.57353, shown: 'fl oz' },
	cup: { system: 'us', dimension: 'volume', size: 236.58824, shown: 'cup' },
	pint: { system: 'us', dimension: 'volume', size: 473.17647, shown: 'pint' },
	quart: { system: 'us', dimension: 'volume', size: 946.35295, shown: 'quart' },
	gallon: { system: 'us', dimension: 'volume', size: 3785.4118, shown: 'gallon' }
} as const;

type UnitId = keyof typeof UNITS;
type Dimension = (typeof UNITS)[UnitId]['dimension'];

/**
 * The units a converted quantity may land in, largest first: the first whose
 * range holds the rounded value and whose rounded value is close enough wins. A cup
 * from ¼; a tablespoon from 1 to 4 (past that it is a cup's fraction); a
 * teaspoon up to 3 (past that a tablespoon); a pound from 1, a quart from 1.
 * Nothing fitting leaves the line as written.
 */
const LADDERS = {
	metric: {
		mass: [{ unit: 'kilogram', min: 1 }, { unit: 'gram' }],
		volume: [{ unit: 'liter', min: 1 }, { unit: 'milliliter' }]
	},
	us: {
		mass: [{ unit: 'pound', min: 1 }, { unit: 'ounce' }],
		volume: [
			{ unit: 'quart', min: 1 },
			{ unit: 'cup', min: 0.25 },
			{ unit: 'tablespoon', min: 1, max: 4 },
			{ unit: 'teaspoon', max: 3 }
		]
	}
} as const satisfies Record<
	Measurement,
	Record<Dimension, readonly { unit: UnitId; min?: number; max?: number }[]>
>;

/** How far a rounded quantity may sit from the exact one: 500 ml is "2 cups" (5.3% off). */
export const TOLERANCE = 0.06;

/**
 * The least weight a teaspoon or tablespoon row is weighed at in Metric. A
 * kitchen scale reads in 1 g steps, so under 5 g one step is a fifth of the
 * amount and the spoon is the better measure: ¼ tsp (0.5g) stays a spoon,
 * 1 tsp (6g) salt is 6 g.
 */
export const MIN_SPOON_GRAMS = 5;

/**
 * Kitchen fractions a US quantity rounds to: measuring cups and spoons have
 * thirds and an ⅛ teaspoon; a scale reads quarters. ⅛ only below one.
 */
const KITCHEN_FRACTIONS = {
	volume: [0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1],
	mass: [0, 1 / 4, 1 / 2, 3 / 4, 1]
} as const satisfies Record<Dimension, readonly number[]>;

/**
 * Metric rounds in grams or millilitres before the unit is chosen: 1 below
 * 50, 5 below 1000, 10 from there (shown as 1.23 kg).
 */
function metricRound(base: number): number {
	const step = base < 50 ? 1 : base < 1000 ? 5 : 10;
	return Math.round(base / step) * step;
}

function kitchenRound(value: number, dimension: Dimension): number {
	const whole = Math.floor(value);
	const parts = KITCHEN_FRACTIONS[dimension].filter((p) => whole === 0 || p !== 1 / 8);
	const nearest = parts.reduce((best, p) =>
		Math.abs(value - whole - p) < Math.abs(value - whole - best) ? p : best
	);
	return whole + nearest;
}

// The stored unit as typed to its id, when it is one that converts.
export function unitId(unit: string): UnitId | undefined {
	const id = unitOfMeasure(unit);
	return id !== undefined && id in UNITS ? (id as UnitId) : undefined;
}

const close = (rounded: number, exact: number) =>
	rounded > 0 && Math.abs(rounded - exact) / exact <= TOLERANCE;

// Both ends (or the one) in the first unit of the ladder that fits them.
function land(bases: number[], to: Measurement, dimension: Dimension) {
	const rounded = to === 'metric' ? bases.map(metricRound) : bases;
	for (const step of LADDERS[to][dimension]) {
		const { size } = UNITS[step.unit];
		const values = rounded.map((base) => base / size);
		const shown = to === 'metric' ? values : values.map((v) => kitchenRound(v, dimension));
		const min = 'min' in step ? step.min : 0;
		const max = 'max' in step ? step.max : Infinity;
		if (shown[0] < min || shown.at(-1)! > max) continue;
		if (shown.every((v, i) => close(v * size, bases[i]))) return { unit: step.unit, values: shown };
	}
	return null;
}

/**
 * One row in the cook's units, after scaling: the measure rewritten from the
 * full-precision quantity, rounded once. `written` is the measure as the
 * line had it ("2 cups", or the scaled "4 cups"), for the page to show
 * beside it; null when the row stays as written, which is also when `to` is
 * null (no preference), the row has no unit this table knows, or its unit
 * is already in the cook's system. A converted weight drops the gram hint:
 * one side of it is already in grams. In Metric a volume of something
 * weighed, with a measured (not whole-item) estimate, leads with that
 * estimate instead (spoons from MIN_SPOON_GRAMS); `estimate` says so.
 */
export function convertIngredient(
	ingredient: Ingredient,
	grams: GramResult | null,
	to: Measurement | null
): {
	ingredient: Ingredient;
	grams: GramResult | null;
	written: string | null;
	estimate: boolean;
} {
	const unchanged = { ingredient, grams, written: null, estimate: false };
	const { quantity, quantity2, unit, name } = ingredient;
	const id = unitId(unit);
	const split = splitMeasure(ingredient);
	if (to === null || quantity === null || id === undefined || split === null) return unchanged;
	const from = UNITS[id];

	const weighed =
		to === 'metric' &&
		from.dimension === 'volume' &&
		// A whole-item estimate never reaches here: a count has no volume unit.
		grams !== null &&
		!grams.likeWater &&
		(from.system !== 'spoon' || grams.grams >= MIN_SPOON_GRAMS);
	// A weight that does not round within tolerance falls back to the volume rules.
	const weight = weighed
		? land(grams.grams2 === null ? [grams.grams] : [grams.grams, grams.grams2], to, 'mass')
		: null;
	if (weight === null && (from.system === to || from.system === 'spoon')) return unchanged;

	const quantities = quantity2 === null ? [quantity] : [quantity, quantity2];
	const landed =
		weight ??
		land(
			quantities.map((q) => q * from.size),
			to,
			from.dimension
		);
	if (landed === null) return unchanged;
	const estimate = weight !== null;

	const [low, high = null] = landed.values;
	const format = (n: number) =>
		to === 'metric' ? String(Math.round(n * 100) / 100) : formatScaled(n);
	const measure = format(low) + (high === null ? '' : `–${format(high)}`);
	const shownUnit = unitFor(UNITS[landed.unit].shown, high ?? low);
	return {
		ingredient: {
			...ingredient,
			quantity: low,
			quantity2: high,
			unit: shownUnit,
			text: [measure, shownUnit, split.between, name].filter(Boolean).join(' ')
		},
		grams: from.dimension === 'mass' || estimate ? null : grams,
		written: split.measure,
		estimate
	};
}
