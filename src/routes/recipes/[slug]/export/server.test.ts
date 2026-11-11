import { describe, test, expect, vi, beforeEach } from 'vitest';
import { error, isHttpError } from '@sveltejs/kit';
import { loadEvent } from '#lib/testing/actions.js';
import { EXPORT_FORMAT, EXPORT_VERSION, type ForkExport } from '#lib/export/archive.js';
import { makeContent } from '#lib/recipes/fixtures.js';

const { exportFor, ownRecipe } = vi.hoisted(() => ({ exportFor: vi.fn(), ownRecipe: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));
vi.mock('#lib/server/export.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/export.js')>()),
	exportFor
}));
vi.mock('#lib/server/visibility.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/visibility.js')>()),
	ownRecipe
}));

const { GET } = await import('./+server.js');
const { NOT_AUTHORIZED } = await import('#lib/server/visibility.js');

const exportOf = (slug: string): ForkExport => ({
	format: EXPORT_FORMAT,
	version: EXPORT_VERSION,
	exportedAt: '2026-11-11T12:00:00.000Z',
	scope: 'recipe',
	profile: {
		username: 'cook',
		url: 'http://localhost/users/cook',
		avatarUrl: null,
		joinedAt: '2026-01-01T00:00:00.000Z'
	},
	recipes: [
		{
			slug,
			url: `http://localhost/recipes/${slug}`,
			audience: 'private',
			tags: [],
			createdAt: '2026-11-01T00:00:00.000Z',
			updatedAt: '2026-11-01T00:00:00.000Z',
			inTrashSince: null,
			forkedFrom: null,
			versions: [
				{ number: 1, date: '2026-11-01T00:00:00.000Z', message: 'First', content: makeContent() }
			]
		}
	],
	collections: [],
	saves: [],
	journal: []
});

const get = (slug: string, format = 'json', user: { id: string } | null = { id: 'me' }) =>
	GET(
		loadEvent({ path: `/recipes/${slug}/export?format=${format}`, params: { slug }, user }) as never
	);

async function thrown(p: Promise<unknown>) {
	const e = await p.catch((e: unknown) => e);
	if (!isHttpError(e)) throw new Error('expected an HTTP error');
	return e;
}

beforeEach(() => {
	exportFor.mockReset();
	ownRecipe.mockReset();
});

describe('GET /recipes/[slug]/export', () => {
	test('signed out: a 401, and the recipe is never looked up', async () => {
		const res = await get('buns', 'json', null);
		expect(res.status).toBe(401);
		expect((await res.json()).code).toBe('unauthenticated');
		expect(ownRecipe).not.toHaveBeenCalled();
	});

	test('someone else’s recipe is the one 403, and nothing is built', async () => {
		ownRecipe.mockImplementation(async () => error(403, NOT_AUTHORIZED));
		const e = await thrown(get('theirs'));
		expect(e.status).toBe(403);
		expect(ownRecipe).toHaveBeenCalledWith('theirs', 'me');
		expect(exportFor).not.toHaveBeenCalled();
	});

	test('the owner gets that recipe alone, named by its slug', async () => {
		ownRecipe.mockResolvedValue({ id: 42, slug: 'buns' });
		exportFor.mockResolvedValue(exportOf('buns'));
		const res = await get('buns', 'md');
		expect(exportFor).toHaveBeenCalledWith('me', 'http://localhost', 42);
		expect(res.headers.get('Content-Disposition')).toContain(
			'filename="fork-export-cook-buns-2026-11-11.md"'
		);
		expect(res.headers.get('Cache-Control')).toBe('no-store');
	});

	test('a slug in another script still names the file: an ASCII fallback and the real name encoded', async () => {
		ownRecipe.mockResolvedValue({ id: 7, slug: '味噌' });
		exportFor.mockResolvedValue(exportOf('味噌'));
		const res = await get(encodeURIComponent('味噌'));
		const name = 'fork-export-cook-味噌-2026-11-11.json';
		expect(res.headers.get('Content-Disposition')).toBe(
			`attachment; filename="fork-export-cook-__-2026-11-11.json"; filename*=UTF-8''${encodeURIComponent(name)}`
		);
	});
});
