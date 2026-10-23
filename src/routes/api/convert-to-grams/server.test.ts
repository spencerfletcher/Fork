import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseIngredientLine as ing } from '#lib/recipes/ingredients.js';

// A key is set so the Spoonacular fallback runs; fetch is stubbed so the tests
// stay offline and can assert what the endpoint asked for.
vi.mock('$app/env/private', () => ({ SPOONACULAR_API_KEY: 'test-key' }));

const fetchMock = vi.fn(async (_url: string) => Response.json({ targetAmount: 42 }));
vi.stubGlobal('fetch', fetchMock);

const { POST } = await import('./+server');

type Body = Record<string, unknown> | unknown[] | string;

function makeEvent(body: Body, ip = '10.0.0.1') {
	const request = new Request('http://localhost/api/convert-to-grams', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
	// Only the fields the handler actually uses.
	return { request, getClientAddress: () => ip } as unknown as Parameters<typeof POST>[0];
}

function spoonacularUnit(): string | null {
	const url = fetchMock.mock.calls[0]?.[0];
	return typeof url === 'string' ? new URL(url).searchParams.get('sourceUnit') : null;
}

const flour = ing('1 cup all-purpose flour');

beforeEach(() => fetchMock.mockClear());

describe('POST /api/convert-to-grams', () => {
	describe('input validation', () => {
		it('rejects a body where ingredients is missing', async () => {
			const res = await POST(makeEvent({}, '10.1.0.1'));
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_INGREDIENTS' });
		});

		it('rejects ingredients that is not an array', async () => {
			const res = await POST(makeEvent({ ingredients: 'flour' }, '10.1.0.2'));
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_INGREDIENTS' });
		});

		it('rejects malformed JSON instead of throwing', async () => {
			const res = await POST(makeEvent('{not json', '10.1.0.3'));
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_JSON' });
		});

		it('rejects an ingredient in the old string-amount shape', async () => {
			const res = await POST(
				makeEvent({ ingredients: [{ amount: '1', unit: 'cup', name: 'flour' }] }, '10.1.0.4')
			);
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_INGREDIENTS' });
		});

		it('rejects a quantity that is not a number or null', async () => {
			const res = await POST(makeEvent({ ingredients: [{ ...flour, quantity: '1' }] }, '10.1.0.5'));
			expect(res.status).toBe(400);
		});

		it('rejects more ingredients than the cap allows', async () => {
			const many = Array.from({ length: 51 }, () => flour);
			const res = await POST(makeEvent({ ingredients: many }, '10.1.0.6'));
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'TOO_MANY_INGREDIENTS' });
		});

		it('accepts exactly the cap', async () => {
			const many = Array.from({ length: 50 }, () => flour);
			const res = await POST(makeEvent({ ingredients: many }, '10.1.0.7'));
			expect(res.status).toBe(200);
		});

		it('returns an error shape of { error, code }', async () => {
			const res = await POST(makeEvent({ ingredients: 5 }, '10.1.0.8'));
			const body = await res.json();
			expect(typeof body.error).toBe('string');
			expect(typeof body.code).toBe('string');
		});
	});

	describe('conversion', () => {
		it('converts a volume line via the density table and does not mark it approximate', async () => {
			const res = await POST(makeEvent({ ingredients: [flour] }, '10.2.0.1'));
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.results).toHaveLength(1);
			expect(body.results[0].grams).toBeGreaterThan(0);
			expect(body.results[0].approximate).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('returns null for an unparsed line without asking Spoonacular', async () => {
			const res = await POST(makeEvent({ ingredients: [ing('salt to taste')] }, '10.2.0.2'));
			await expect(res.json()).resolves.toEqual({ results: [null] });
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('converts a count line from the per-item table and marks it approximate', async () => {
			const res = await POST(makeEvent({ ingredients: [ing('2 eggs')] }, '10.2.0.3'));
			await expect(res.json()).resolves.toEqual({
				results: [{ grams: 100, approximate: true }]
			});
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('asks Spoonacular with the piece unit for a count line not in the table', async () => {
			const res = await POST(makeEvent({ ingredients: [ing('3 dragon fruit')] }, '10.2.0.4'));
			await expect(res.json()).resolves.toEqual({
				results: [{ grams: 42, approximate: true }]
			});
			expect(spoonacularUnit()).toBe('piece');
		});

		it('asks Spoonacular with the typed unit for a volume line not in the table', async () => {
			const res = await POST(makeEvent({ ingredients: [ing('1 cup dragon fruit')] }, '10.2.0.5'));
			await expect(res.json()).resolves.toEqual({
				results: [{ grams: 42, approximate: false }]
			});
			expect(spoonacularUnit()).toBe('cup');
		});

		it('accepts an empty ingredient list', async () => {
			const res = await POST(makeEvent({ ingredients: [] }, '10.2.0.6'));
			expect(res.status).toBe(200);
			await expect(res.json()).resolves.toEqual({ results: [] });
		});
	});

	describe('rate limiting', () => {
		it('rejects once an address exceeds the limit', async () => {
			const ip = '10.3.0.1';
			let last!: Response;
			for (let i = 0; i < 40; i++) {
				last = await POST(makeEvent({ ingredients: [flour] }, ip));
				if (last.status === 429) break;
			}
			expect(last.status).toBe(429);
			await expect(last.json()).resolves.toMatchObject({ code: 'RATE_LIMITED' });
			expect(last.headers.get('Retry-After')).toBeTruthy();
		});

		it('tracks addresses independently', async () => {
			const noisy = '10.3.0.2';
			for (let i = 0; i < 40; i++) {
				const res = await POST(makeEvent({ ingredients: [flour] }, noisy));
				if (res.status === 429) break;
			}
			const quiet = await POST(makeEvent({ ingredients: [flour] }, '10.3.0.3'));
			expect(quiet.status).toBe(200);
		});
	});
});
