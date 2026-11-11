import { describe, test, expect } from 'vitest';
import { SITEMAP_MAX, urlset } from './sitemap.js';

describe('urlset', () => {
	test('writes each URL with its lastmod, in the sitemap namespace', () => {
		const xml = urlset([
			{ loc: 'https://fork.test/' },
			{ loc: 'https://fork.test/recipes/soup-ab12', lastmod: new Date('2026-11-03T10:00:00Z') }
		]);
		expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('<url><loc>https://fork.test/</loc></url>');
		expect(xml).toContain(
			'<url><loc>https://fork.test/recipes/soup-ab12</loc><lastmod>2026-11-03T10:00:00.000Z</lastmod></url>'
		);
	});

	test('escapes every value, so a slug or handle with & or < leaves the XML well formed', () => {
		const xml = urlset([{ loc: `https://fork.test/users/a&b<c>"d'e` }]);
		expect(xml).toContain('<loc>https://fork.test/users/a&amp;b&lt;c&gt;&quot;d&apos;e</loc>');
		expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
	});

	test('holds at most SITEMAP_MAX URLs', () => {
		const many = Array.from({ length: SITEMAP_MAX + 3 }, (_, i) => ({
			loc: `https://fork.test/${i}`
		}));
		expect(urlset(many).match(/<url>/g)).toHaveLength(SITEMAP_MAX);
	});
});
