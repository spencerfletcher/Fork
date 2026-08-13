import { describe, it, expect, vi } from 'vitest';

// The endpoint reads SPOONACULAR_API_KEY at module scope; without a key it
// skips the external fallback, which keeps these tests offline.
vi.mock('$env/dynamic/private', () => ({ env: {} }));

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

const flour = { amount: '1', unit: 'cup', name: 'all-purpose flour' };

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

		it('rejects an ingredient whose fields are not strings', async () => {
			const res = await POST(
				makeEvent({ ingredients: [{ amount: 1, unit: 'cup', name: 'flour' }] }, '10.1.0.4')
			);
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_INGREDIENTS' });
		});

		it('rejects more ingredients than the cap allows', async () => {
			const many = Array.from({ length: 51 }, () => flour);
			const res = await POST(makeEvent({ ingredients: many }, '10.1.0.5'));
			expect(res.status).toBe(400);
			await expect(res.json()).resolves.toMatchObject({ code: 'TOO_MANY_INGREDIENTS' });
		});

		it('accepts exactly the cap', async () => {
			const many = Array.from({ length: 50 }, () => flour);
			const res = await POST(makeEvent({ ingredients: many }, '10.1.0.6'));
			expect(res.status).toBe(200);
		});

		it('returns an error shape of { error, code }', async () => {
			const res = await POST(makeEvent({ ingredients: 5 }, '10.1.0.7'));
			const body = await res.json();
			expect(typeof body.error).toBe('string');
			expect(typeof body.code).toBe('string');
		});
	});

	describe('conversion', () => {
		it('converts a known ingredient via the density table', async () => {
			const res = await POST(makeEvent({ ingredients: [flour] }, '10.2.0.1'));
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.results).toHaveLength(1);
			expect(body.results[0]).toBeGreaterThan(0);
		});

		it('returns null for an ingredient with no unit', async () => {
			const res = await POST(
				makeEvent({ ingredients: [{ amount: '2', unit: '', name: 'eggs' }] }, '10.2.0.2')
			);
			const body = await res.json();
			expect(body.results).toEqual([null]);
		});

		it('accepts an empty ingredient list', async () => {
			const res = await POST(makeEvent({ ingredients: [] }, '10.2.0.3'));
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
