import type { RequestHandler } from './$types';

// Served, not a static file, so the Sitemap line can name this origin.
// Public recipes, profiles, Discover and tags are open. Signed-in pages are
// also noindex in their head; these just save the crawl.
// /recipes/new is anchored: a recipe titled "New potatoes" has a slug that starts with "new".
const RULES = `User-agent: *
Disallow: /cookbook
Disallow: /journal
Disallow: /friends
Disallow: /settings
Disallow: /favorites
Disallow: /recipes/new$
Disallow: /recipes/*/edit
Disallow: /logout
Disallow: /reset-password
Disallow: /confirm-email
`;

export const GET: RequestHandler = ({ url }) =>
	new Response(`${RULES}\nSitemap: ${url.origin}/sitemap.xml\n`, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
