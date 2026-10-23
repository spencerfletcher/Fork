import { SPOONACULAR_API_KEY } from '$app/env/private';
import { lookupGrams, lookupPieceGrams } from '#lib/server/ingredientDensities.js';
import type { RequestHandler } from './$types';
import type { Ingredient } from '#lib/recipes/types.ts';

type GramResult = { grams: number; approximate: boolean };

// No recipe needs more than this, and each entry can cost a Spoonacular call
// against a 150/day quota.
const MAX_INGREDIENTS = 50;
const MAX_FIELD_LENGTH = 200;

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Fixed-window counter per address. This is per-instance state, so on a
// serverless host it bounds abuse per warm instance rather than globally —
// enough to protect the Spoonacular quota from a single caller.
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(address: string, now: number): { ok: boolean; retryAfter: number } {
	for (const [key, entry] of hits) {
		if (entry.resetAt <= now) hits.delete(key);
	}

	const entry = hits.get(address);
	if (!entry || entry.resetAt <= now) {
		hits.set(address, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return { ok: true, retryAfter: 0 };
	}

	entry.count += 1;
	if (entry.count > RATE_LIMIT_MAX) {
		return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
	}
	return { ok: true, retryAfter: 0 };
}

function isIngredient(value: unknown): value is Ingredient {
	if (typeof value !== 'object' || value === null) return false;
	const { text, unit, name, quantity, quantity2 } = value as Record<string, unknown>;
	const stringsOk = [text, unit, name].every(
		(field) => typeof field === 'string' && field.length <= MAX_FIELD_LENGTH
	);
	const numbersOk = [quantity, quantity2].every(
		(field) => field === null || typeof field === 'number'
	);
	return stringsOk && numbersOk;
}

function fail(code: string, message: string, status: number, headers?: Record<string, string>) {
	return Response.json({ error: message, code }, { status, headers });
}

async function convertViaSpoonacular(
	quantity: number,
	unit: string,
	name: string
): Promise<number | null> {
	if (!SPOONACULAR_API_KEY) return null;

	try {
		const params = new URLSearchParams({
			ingredientName: name,
			sourceAmount: String(quantity),
			sourceUnit: unit,
			targetUnit: 'grams',
			apiKey: SPOONACULAR_API_KEY
		});
		const res = await fetch(`https://api.spoonacular.com/recipes/convert?${params}`);
		if (!res.ok) return null;
		const data = await res.json();
		return typeof data.targetAmount === 'number' ? data.targetAmount : null;
	} catch {
		return null;
	}
}

// Deliberately unauthenticated: the gram toggle sits on public recipe pages,
// so guests need it. Abuse is bounded by the rate limit and the size caps.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const limit = rateLimit(getClientAddress(), Date.now());
	if (!limit.ok) {
		return fail('RATE_LIMITED', 'Too many requests. Try again shortly.', 429, {
			'Retry-After': String(limit.retryAfter)
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return fail('INVALID_JSON', 'Request body must be valid JSON.', 400);
	}

	const ingredients = (body as { ingredients?: unknown } | null)?.ingredients;

	if (!Array.isArray(ingredients)) {
		return fail('INVALID_INGREDIENTS', 'Expected an "ingredients" array.', 400);
	}
	if (ingredients.length > MAX_INGREDIENTS) {
		return fail('TOO_MANY_INGREDIENTS', `At most ${MAX_INGREDIENTS} ingredients per request.`, 400);
	}
	if (!ingredients.every(isIngredient)) {
		return fail(
			'INVALID_INGREDIENTS',
			'Each ingredient needs text, unit and name strings, and a numeric or null quantity.',
			400
		);
	}

	const results = await Promise.all(
		ingredients.map(async (ingredient): Promise<GramResult | null> => {
			const { quantity, unit, name } = ingredient;
			if (quantity === null) return null;

			if (unit) {
				const grams =
					lookupGrams(quantity, unit, name) ?? (await convertViaSpoonacular(quantity, unit, name));
				return grams === null ? null : { grams, approximate: false };
			}

			// No unit means a count ("2 eggs"): whole-item weights are estimates.
			const grams =
				lookupPieceGrams(quantity, name) ?? (await convertViaSpoonacular(quantity, 'piece', name));
			return grams === null ? null : { grams, approximate: true };
		})
	);

	return Response.json({ results });
};
