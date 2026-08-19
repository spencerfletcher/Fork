/**
 * Page metadata for link previews.
 *
 * Rendered in exactly one place — the root layout reads `$page.data.meta` and
 * emits the tags. Pages contribute by returning `meta` from their loader rather
 * than by writing their own `<svelte:head>`: Svelte does not deduplicate head
 * tags across a layout and its page, so two components both emitting `og:title`
 * would put two of them in the document and leave which one wins to the crawler.
 */
export interface PageMeta {
	title: string;
	description: string;
	/** Absolute URL. Relative paths are ignored by every crawler that matters. */
	image?: string;
	/** 'website' for listings, 'article' for a single recipe. */
	type?: 'website' | 'article';
}

export const SITE_NAME = 'Fork';
export const SITE_URL = 'https://recipes.spencerfletcher.com';
export const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`;

export const DEFAULT_META: PageMeta = {
	title: 'Fork — git-style version control for recipes',
	description:
		'Every edit is a version with a commit message, any recipe can be forked, and any two versions can be diffed.',
	image: DEFAULT_IMAGE,
	type: 'website'
};

/** Titles read as "<page> — Fork", except the home page which is already branded. */
export function pageTitle(title: string): string {
	return title === DEFAULT_META.title ? title : `${title} — ${SITE_NAME}`;
}

/**
 * Recipe images are user-supplied and may be a relative placeholder such as
 * `/None.png`, which is useless in a link preview. Fall back to the site card
 * unless the URL is absolute.
 */
export function absoluteImage(url: string | null | undefined): string {
	return url && /^https?:\/\//.test(url) ? url : DEFAULT_IMAGE;
}

/** Trims a description to a length link previews will not cut mid-word. */
export function clampDescription(text: string, max = 160): string {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (clean.length <= max) return clean;
	const cut = clean.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
