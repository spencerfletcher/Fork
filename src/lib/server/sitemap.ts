import { desc, eq, max } from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import { profiles, recipes } from './db/schema.js';
import { visibleTo } from './visibility.js';

/**
 * The most URLs the one sitemap lists (the protocol allows 50,000 and 50MB).
 * ponytail: one sitemap, cut at 5,000 URLs; past that, serve a sitemap index
 * over keyset pages of recipes.
 */
export const SITEMAP_MAX = 5000;

export type SitemapUrl = { loc: string; lastmod?: Date };

const XML_ENTITIES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;'
};
const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (c) => XML_ENTITIES[c]);

/** The sitemap document for `urls`, the first SITEMAP_MAX of them, every value escaped. */
export function urlset(urls: SitemapUrl[]): string {
	const rows = urls.slice(0, SITEMAP_MAX).map(({ loc, lastmod }) => {
		const changed = lastmod ? `<lastmod>${xmlEscape(lastmod.toISOString())}</lastmod>` : '';
		return `<url><loc>${xmlEscape(loc)}</loc>${changed}</url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...rows,
		'</urlset>',
		''
	].join('\n');
}

/**
 * What a signed-out visitor can open, as absolute URLs on `origin`: home,
 * Discover, each cook whose profile shows a public recipe, and each public
 * recipe at its canonical (latest) URL, newest change first. One rule for all
 * of it, visibleTo(null): never a Friends or Only-me recipe, one in the Trash
 * or erased, or a saver's kept copy.
 */
export async function sitemapUrls(
	origin: string,
	conn: Tx | typeof db = db
): Promise<SitemapUrl[]> {
	const visible = visibleTo(null);
	const lastChange = max(recipes.updatedAt);
	const [cooks, shown] = await Promise.all([
		conn
			.select({ username: profiles.username, lastmod: lastChange })
			.from(profiles)
			.innerJoin(recipes, eq(recipes.authorId, profiles.id))
			.where(visible)
			.groupBy(profiles.id)
			.orderBy(desc(lastChange))
			.limit(SITEMAP_MAX),
		conn
			.select({ slug: recipes.slug, lastmod: recipes.updatedAt })
			.from(recipes)
			.where(visible)
			.orderBy(desc(recipes.updatedAt), desc(recipes.id))
			.limit(SITEMAP_MAX)
	]);
	return [
		{ loc: `${origin}/` },
		{ loc: `${origin}/discover` },
		...cooks.map((c) => ({
			loc: `${origin}/users/${encodeURIComponent(c.username)}`,
			lastmod: c.lastmod ?? undefined
		})),
		...shown.map((r) => ({
			loc: `${origin}/recipes/${encodeURIComponent(r.slug)}`,
			lastmod: r.lastmod
		}))
	];
}
