import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { lookupGrams } from '$lib/server/ingredientDensities';
import type { RequestHandler } from './$types';

interface IngredientInput {
	amount: string;
	unit: string;
	name: string;
}

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

function isIngredientInput(value: unknown): value is IngredientInput {
	if (typeof value !== 'object' || value === null) return false;
	const { amount, unit, name } = value as Record<string, unknown>;
	return [amount, unit, name].every(
		(field) => typeof field === 'string' && field.length <= MAX_FIELD_LENGTH
	);
}

function fail(code: string, message: string, status: number, headers?: Record<string, string>) {
	return json({ error: message, code }, { status, headers });
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
	if (!ingredients.every(isIngredientInput)) {
		return fail(
			'INVALID_INGREDIENTS',
			'Each ingredient needs string amount, unit, and name fields.',
			400
		);
	}

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
