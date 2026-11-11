import { sitemapUrls, urlset } from '#lib/server/sitemap.js';
import type { RequestHandler } from './$types';

// Public: what a signed-out visitor can open, the same for everyone who asks.
export const GET: RequestHandler = async ({ url }) =>
	new Response(urlset(await sitemapUrls(url.origin)), {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
	});
