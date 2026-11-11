import { describe, test, expect, vi } from 'vitest';
import { loadEvent } from '#lib/testing/actions.js';

const { sitemapUrls } = vi.hoisted(() => ({ sitemapUrls: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));
vi.mock('#lib/server/sitemap.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/sitemap.js')>()),
	sitemapUrls
}));

const { GET } = await import('./+server.js');

describe('GET /sitemap.xml', () => {
	test("is XML for the request's origin, cached for an hour", async () => {
		sitemapUrls.mockResolvedValue([{ loc: 'http://localhost/' }]);
		const response = await GET(loadEvent({ path: '/sitemap.xml' }) as never);
		expect(sitemapUrls).toHaveBeenCalledWith('http://localhost');
		expect(response.headers.get('content-type')).toBe('application/xml');
		expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
		expect(await response.text()).toContain('<loc>http://localhost/</loc>');
	});
});
