import { vi, describe, test, expect, beforeEach } from 'vitest';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { load } from './+page.server';
import { makeContent } from '#lib/recipes/fixtures.js';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { findRecipeMock } = vi.hoisted(() => ({ findRecipeMock: vi.fn() }));

vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { recipes: { findFirst: findRecipeMock } } }
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const version = (versionNumber: number) => ({
	versionNumber,
	commitMessage: `Version ${versionNumber}`,
	creator: null,
	createdAt: new Date(2026, 1, versionNumber),
	...makeContent({ title: 'Classic Cookies', servings: versionNumber * 4 })
});

const RECIPE = {
	id: 1,
	slug: 'classic-cookies',
	title: 'Classic Cookies',
	isPublic: true,
	authorId: 'author',
	author: { id: 'author', username: 'chef' },
	versions: [version(1), version(2), version(3)]
};

function loadWith(query: string, user: { id: string } | null = null): Promise<unknown> {
	return Promise.resolve(
		load({
			params: { slug: 'classic-cookies' },
			url: new URL(`http://localhost/recipes/classic-cookies/diff${query}`),
			locals: { user }
		} as never)
	);
}

beforeEach(() => {
	findRecipeMock.mockResolvedValue(RECIPE);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('compare page load', () => {
	test('names the range and the recipe in the tab title', async () => {
		const data = (await loadWith('?from=2&to=3')) as { meta: { title: string } };
		expect(data.meta.title).toBe('v2 → v3 · Classic Cookies');
	});

	test('the same version on both sides is named once in the tab title, not "v2 → v2"', async () => {
		const data = (await loadWith('?from=2&to=2')) as { meta: { title: string } };
		expect(data.meta.title).toBe('v2 · same version · Classic Cookies');
	});

	test('no range compares the first version with the latest (the error page links here)', async () => {
		const data = (await loadWith('')) as {
			fromVersion: { versionNumber: number };
			toVersion: { versionNumber: number };
		};
		expect(data.fromVersion.versionNumber).toBe(RECIPE.versions[0].versionNumber);
		expect(data.toVersion.versionNumber).toBe(RECIPE.versions.at(-1)?.versionNumber);
	});

	test('a reversed pair redirects to the same pair read older to newer', async () => {
		const result = await loadWith('?from=3&to=1').catch((e: unknown) => e);
		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ location: '/recipes/classic-cookies/diff?from=1&to=3' });
	});

	test('the same version on both sides loads, so the page can say so', async () => {
		const data = (await loadWith('?from=2&to=2')) as {
			fromVersion: { versionNumber: number };
			toVersion: { versionNumber: number };
		};
		expect(data.fromVersion.versionNumber).toBe(2);
		expect(data.toVersion.versionNumber).toBe(2);
	});

	test.each([
		['?from=1&to=9', 'Version 9 not found'],
		['?from=12&to=3', 'Version 12 not found'],
		['?from=9&to=12', 'Versions 9 and 12 not found']
	])('a version that does not exist (%s) is a 400 that names it', async (query, message) => {
		const result = await loadWith(query).catch((e: unknown) => e);
		expect(isHttpError(result)).toBe(true);
		expect(result).toMatchObject({ status: 400, body: { message } });
	});

	test("a missing numbered version carries the recipe's version count, so the page can name the range", async () => {
		const result = await loadWith('?from=1&to=9').catch((e: unknown) => e);
		expect(result).toMatchObject({
			status: 400,
			body: { message: 'Version 9 not found', versionCount: RECIPE.versions.length }
		});
	});

	test('a non-number carries no count', async () => {
		const result = (await loadWith('?from=abc&to=3').catch((e: unknown) => e)) as {
			body: App.Error;
		};
		expect(result.body.versionCount).toBeUndefined();
	});

	test.each(['?from=abc&to=3', '?from=1.5&to=3', '?from=abc&to=12'])(
		'a range that is not a version number (%s) is a 400 that echoes nothing, never NaN',
		async (query) => {
			const result = await loadWith(query).catch((e: unknown) => e);
			expect(isHttpError(result)).toBe(true);
			expect(result).toMatchObject({ status: 400, body: { message: 'Version not found' } });
		}
	);
});

describe('compare page visibility', () => {
	test("another user's private recipe answers 404, as for a missing recipe", async () => {
		findRecipeMock.mockResolvedValue({ ...RECIPE, isPublic: false });
		const result = await loadWith('', { id: 'someone-else' }).catch((e: unknown) => e);
		expect(result).toMatchObject({ status: 404, body: { message: 'Recipe not found' } });
	});

	test('its author can compare it', async () => {
		findRecipeMock.mockResolvedValue({ ...RECIPE, isPublic: false });
		const data = await loadWith('', { id: RECIPE.authorId });
		expect(data).toMatchObject({ recipe: { slug: RECIPE.slug } });
	});
});
