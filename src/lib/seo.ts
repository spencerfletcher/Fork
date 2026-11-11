/**
 * Page metadata for link previews, search engines and Recipe structured data.
 *
 * Rendered in exactly one place — the root layout reads `$page.data.meta` and
 * emits the tags. Pages contribute by returning `meta` from their loader rather
 * than by writing their own `<svelte:head>`: Svelte does not deduplicate head
 * tags across a layout and its page, so two components both emitting `og:title`
 * would put two of them in the document and leave which one wins to the crawler.
 */
import { timeSpans } from './recipes/times.js';
import { groupStartingAt } from './recipes/groups.js';
import type { RecipeContent, Step } from './recipes/types.js';

export interface PageMeta {
	title: string;
	description?: string;
	/**
	 * An absolute URL, or a path on this site. null: the page has no picture of
	 * its own, so the site card stands in as a small card.
	 */
	image?: string | null;
	/** 'website' for listings, 'article' for a single recipe. */
	type?: 'website' | 'article';
	/**
	 * Not for search engines or link previews: a signed-in page, or one whose
	 * content not everyone may see. The head carries the title and
	 * `robots: noindex` only — no description, canonical, og or twitter tags.
	 */
	noindex?: boolean;
	/** schema.org data, serialised by `ldScript` in the layout. */
	jsonLd?: Record<string, unknown>;
}

export const SITE_NAME = 'Fork';
/** A path: the layout resolves it against the request's origin. */
export const DEFAULT_IMAGE = '/og.jpg';

export const DEFAULT_META = {
	title: 'Fork — recipes that remember every change',
	description:
		'Keep every version of a recipe with a note on what changed and why, and fork someone’s recipe to make your own copy that still credits them.',
	image: DEFAULT_IMAGE,
	type: 'website'
} satisfies PageMeta;

/** What a signed-in page returns: its title, kept out of search. */
export const privatePage = (title: string): PageMeta => ({ title, noindex: true });

/** Titles read as "<page> — Fork", except the home page which is already branded. */
export function pageTitle(title: string): string {
	return title === DEFAULT_META.title ? title : `${title} — ${SITE_NAME}`;
}

/**
 * Recipe images are user-supplied and may be a relative path, which resolves
 * against the crawler's host in a link preview. Only an absolute URL counts.
 */
export function absoluteImage(url: string | null | undefined): string | null {
	return url && /^https?:\/\//.test(url) ? url : null;
}

const DESCRIPTION_MAX = 160;
/** A recipe's preview says a little more than a listing's. */
export const RECIPE_DESCRIPTION_MAX = 200;

/** Trims a description to a length link previews will not cut mid-word. */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (clean.length <= max) return clean;
	const cut = clean.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** Stored minutes as an ISO 8601 duration ("PT1H30M"); hours are not rolled into days. */
export function isoDuration(minutes: number | null): string | undefined {
	if (!minutes) return undefined;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
}

/**
 * JSON-LD inside a script tag. Escaping <, > and & keeps recipe text from
 * closing the tag or opening markup; U+2028/9 are escaped for old JS parsers.
 */
export function ldScript(data: Record<string, unknown>): string {
	const json = JSON.stringify(data).replace(
		/[<>&\u2028\u2029]/g,
		(c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
	);
	return `<script type="application/ld+json">${json}</script>`;
}

export interface RecipeMetaInput {
	/** The request's origin: every URL in the output is absolute. */
	origin: string;
	slug: string;
	/** Public, and not a kept copy: what a signed-out visitor could open. */
	isPublic: boolean;
	/** The shown version is the latest, the one the canonical URL shows. */
	latest: boolean;
	/** The author's username, if the profile exists. */
	author: string | null;
	tags: string[];
	/** The parent's slug when it is public and not in the Trash. */
	parentSlug: string | null;
	/** When the first version was written. */
	published: Date;
	version: RecipeContent & { createdAt: Date };
}

/**
 * A recipe page's metadata. Only a public recipe gets a description, photo and
 * Recipe data; anything else gets the title its viewer already sees, and
 * noindex. Recipe data describes the latest version alone, since every
 * version's page names the latest as canonical.
 */
export function recipeMeta(input: RecipeMetaInput): PageMeta {
	const { version } = input;
	if (!input.isPublic) return privatePage(version.title);
	const image = absoluteImage(version.imageUrl);
	return {
		title: version.title,
		description: clampDescription(
			version.description ?? composedDescription(version),
			RECIPE_DESCRIPTION_MAX
		),
		image,
		type: 'article',
		jsonLd: input.latest ? recipeData(input, image) : undefined
	};
}

/** "Serves 4 · 10 min prep. Flour, egg, salt and more." from what is stored. */
function composedDescription(version: RecipeContent): string {
	const facts = [
		version.servings ? `Serves ${version.servings}` : null,
		version.makes ? `Makes ${version.makes}` : null,
		...timeSpans(version).map((t) => `${t.value} ${t.word}`)
	].filter((f) => f !== null);
	const names = version.ingredients.map((i) => i.name || i.text).filter(Boolean);
	const first = names.slice(0, 3).join(', ');
	const ingredients = first
		? `${first[0].toUpperCase()}${first.slice(1)}${names.length > 3 ? ' and more' : ''}.`
		: '';
	const text = [facts.length ? `${facts.join(' · ')}.` : '', ingredients].filter(Boolean).join(' ');
	return text || `${version.title}, a recipe on Fork.`;
}

const nonEmpty = <T>(list: T[]) => (list.length ? list : undefined);

/** schema.org Recipe: only what is stored, no total time (the product has none). */
function recipeData(input: RecipeMetaInput, image: string | null): Record<string, unknown> {
	const { origin, version } = input;
	const source =
		version.sourceName || version.sourceUrl
			? {
					'@type': 'CreativeWork',
					name: version.sourceName ?? undefined,
					url: version.sourceUrl ?? undefined
				}
			: null;
	return {
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name: version.title,
		url: `${origin}/recipes/${input.slug}`,
		description: version.description ?? undefined,
		image: image ? [image] : undefined,
		author: input.author
			? {
					'@type': 'Person',
					name: `@${input.author}`,
					url: `${origin}/users/${encodeURIComponent(input.author)}`
				}
			: undefined,
		datePublished: input.published.toISOString(),
		dateModified: version.createdAt.toISOString(),
		recipeYield: nonEmpty(
			[version.servings ? `${version.servings} servings` : null, version.makes].filter(
				(y) => y !== null
			)
		),
		prepTime: isoDuration(version.prepTimeMinutes),
		cookTime: isoDuration(version.cookTimeMinutes),
		recipeIngredient: version.ingredients.map((i) => i.text),
		recipeInstructions: instructions(version.steps),
		keywords: input.tags.join(', ') || undefined,
		// isBasedOn over citation: schema.org's "derived from or adapted from",
		// which a fork and an outside source both are.
		isBasedOn: nonEmpty(
			[input.parentSlug ? `${origin}/recipes/${input.parentSlug}` : null, source].filter(
				(b) => b !== null
			)
		)
	};
}

type HowToStep = { '@type': 'HowToStep'; text: string };
type HowToSection = { '@type': 'HowToSection'; name: string; itemListElement: HowToStep[] };

/** Steps in order; a run of steps under one "# Name" heading is a HowToSection. */
function instructions(steps: Step[]): Array<HowToStep | HowToSection> {
	const out: Array<HowToStep | HowToSection> = [];
	let section: HowToSection | null = null;
	steps.forEach((step, i) => {
		const howTo: HowToStep = { '@type': 'HowToStep', text: step.text };
		if (step.group === undefined) {
			section = null;
			out.push(howTo);
			return;
		}
		if (groupStartingAt(steps, i) !== undefined || !section) {
			section = { '@type': 'HowToSection', name: step.group, itemListElement: [] };
			out.push(section);
		}
		section.itemListElement.push(howTo);
	});
	return out;
}
