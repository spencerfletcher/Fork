import { describe, test, expect } from 'vitest';
import { loadEvent } from '#lib/testing/actions.js';
import { GET } from './+server.js';

describe('GET /robots.txt', () => {
	test('keeps crawlers out of the signed-in areas and names the sitemap on this origin', async () => {
		const response = GET(loadEvent({ path: '/robots.txt' }) as never) as Response;
		const body = await response.text();
		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(body).toMatch(/^User-agent: \*$/m);
		expect(body).toMatch(/^Disallow: \/cookbook$/m);
		expect(body).not.toMatch(/^Disallow: \/recipes\/?$/m);
		expect(body.trimEnd().split('\n').at(-1)).toBe('Sitemap: http://localhost/sitemap.xml');
	});
});
