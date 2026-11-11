import { wholeNumber } from './helpers.js';

/** Cards in one page of a recipe card list: 24 fills whole rows of the 1-, 2-, 3- and 4-column grids. */
export const CARDS_PER_PAGE = 24;

/** The most pages one `?page=` read renders, so a URL cannot ask for a whole table. */
export const MAX_PAGES = 40;

/** The params that say where in a list the reader is, not what it lists: a filter change drops them. */
const PLACE = ['page', 'after'];

/**
 * The slice of a list a URL asks for. `?after=<cursor>` is one page after the
 * cursor: Show more's fetch. Otherwise `?page=N` is the first N pages in one
 * read: Show more's link without JavaScript, and what Back and a reload ask
 * for once Show more has written it into the URL. `?per=` only shrinks a page
 * below `size` (the e2e suite has few recipes), never grows it.
 */
export function listPage(
	url: URL,
	size: number = CARDS_PER_PAGE
): { after: string | null; limit: number; per: number } {
	const per = Math.min(wholeNumber(url.searchParams.get('per') ?? '') || size, size);
	const after = url.searchParams.get('after');
	if (after) return { after, limit: per, per };
	const pages = Math.min(wholeNumber(url.searchParams.get('page') ?? '') || 1, MAX_PAGES);
	return { after: null, limit: pages * per, per };
}

/** `params` without the loaded place, for a link that changes what the list shows. */
export function withoutPlace(params: URLSearchParams): URLSearchParams {
	const kept = new URLSearchParams(params);
	for (const key of PLACE) kept.delete(key);
	return kept;
}
