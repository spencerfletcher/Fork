import { describe, test, expect, vi, beforeEach } from 'vitest';
import { loadEvent } from '#lib/testing/actions.js';
import { EXPORT_FORMAT, EXPORT_VERSION, type ForkExport } from '#lib/export/archive.js';
import { toMarkdown } from '#lib/export/markdown.js';

const { exportFor } = vi.hoisted(() => ({ exportFor: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));
vi.mock('#lib/server/export.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/export.js')>()),
	exportFor
}));

const { GET } = await import('./+server.js');
const { EXPORT_SIGNED_OUT, EXPORT_BAD_FORMAT } = await import('#lib/server/export.js');

const EXPORT: ForkExport = {
	format: EXPORT_FORMAT,
	version: EXPORT_VERSION,
	exportedAt: '2026-11-11T12:00:00.000Z',
	scope: 'library',
	profile: {
		username: 'cook',
		url: 'http://localhost/users/cook',
		avatarUrl: null,
		joinedAt: '2026-01-01T00:00:00.000Z'
	},
	recipes: [],
	collections: [],
	saves: [],
	journal: []
};

const get = (path: string, user: { id: string } | null = { id: 'me' }) =>
	GET(loadEvent({ path, user }) as never);

beforeEach(() => {
	exportFor.mockReset();
	exportFor.mockResolvedValue(EXPORT);
});

describe('GET /settings/export', () => {
	test('signed out: a 401 in the { error, code } shape, and nothing is built', async () => {
		const res = await get('/settings/export?format=json', null);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: EXPORT_SIGNED_OUT, code: 'unauthenticated' });
		expect(exportFor).not.toHaveBeenCalled();
	});

	test('a format not offered is a 400', async () => {
		const res = await get('/settings/export?format=zip');
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: EXPORT_BAD_FORMAT, code: 'invalid' });
	});

	test('JSON: the signed-in cook’s export, whatever the URL names, as an uncached attachment', async () => {
		const res = await get('/settings/export?format=json&user=someone-else');
		expect(exportFor).toHaveBeenCalledWith('me', 'http://localhost');
		expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
		expect(res.headers.get('Cache-Control')).toBe('no-store');
		expect(res.headers.get('Content-Disposition')).toBe(
			`attachment; filename="fork-export-cook-2026-11-11.json"; filename*=UTF-8''fork-export-cook-2026-11-11.json`
		);
		expect(JSON.parse(await res.text())).toEqual(EXPORT);
	});

	test('Markdown: the readable form, its own name and type', async () => {
		const res = await get('/settings/export?format=md');
		expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
		expect(res.headers.get('Content-Disposition')).toContain(
			'filename="fork-export-cook-2026-11-11.md"'
		);
		expect(await res.text()).toBe(toMarkdown(EXPORT));
	});
});
