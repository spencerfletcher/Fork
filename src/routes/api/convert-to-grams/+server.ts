import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { lookupGrams } from '$lib/server/ingredientDensities';
import type { RequestHandler } from './$types';

interface IngredientInput {
	amount: string;
	unit: string;
	name: string;
}

function parseAmount(amount: string): number {
	const vulgar: Record<string, number> = {
		'½': 0.5,
		'¼': 0.25,
		'¾': 0.75,
		'⅓': 1 / 3,
		'⅔': 2 / 3,
		'⅛': 0.125,
		'⅜': 0.375,
		'⅝': 0.625,
		'⅞': 0.875
	};
	const t = amount.trim();
	if (vulgar[t] !== undefined) return vulgar[t];
	const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
	if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
	const frac = t.match(/^(\d+)\/(\d+)$/);
	if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
	return parseFloat(t) || 0;
}

async function convertViaSpoonacular(
	amount: number,
	unit: string,
	name: string
): Promise<number | null> {
	if (!env.SPOONACULAR_API_KEY) return null;
	try {
		const params = new URLSearchParams({
			ingredientName: name,
			sourceAmount: String(amount),
			sourceUnit: unit,
			targetUnit: 'grams',
			apiKey: env.SPOONACULAR_API_KEY
		});
		const res = await fetch(`https://api.spoonacular.com/recipes/convert?${params}`);
		if (!res.ok) return null;
		const data = await res.json();
		return typeof data.targetAmount === 'number' ? data.targetAmount : null;
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const { ingredients }: { ingredients: IngredientInput[] } = await request.json();

	const results = await Promise.all(
		ingredients.map(async (ingredient) => {
			const { amount: rawAmount, unit, name } = ingredient;

			if (!unit) return null;

			const amount = parseAmount(rawAmount);
			if (amount === 0) return null;

			// Table lookup first
			const tableResult = lookupGrams(amount, unit, name);
			if (tableResult !== null) return tableResult;

			// Spoonacular fallback
			return await convertViaSpoonacular(amount, unit, name);
		})
	);

	return json({ results });
};
