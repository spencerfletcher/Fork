import type { CardSort } from '#lib/listPage.js';

/** The Cookbook's segmented filter, in display order; `?filter=` holds one. */
export const COOKBOOK_FILTERS = ['all', 'mine', 'saved'] as const;
export type CookbookFilter = (typeof COOKBOOK_FILTERS)[number];

/** Grid | List, in display order; `?view=` holds one, else the device's last choice, else grid. */
export const COOKBOOK_VIEWS = ['grid', 'list'] as const;
export type CookbookView = (typeof COOKBOOK_VIEWS)[number];

/** Where the device remembers the view, so the first paint is already the cook's choice. */
export const VIEW_COOKIE = 'cookbook_view';

/** Each order's words: the Sort select's options, a phone's View rows and its sort pill. */
export const SORT_LABELS: Record<CardSort, string> = {
	newest: 'Newest change',
	cooked: 'Recently cooked',
	most: 'Most cooked',
	stale: 'Not cooked lately',
	title: 'Title A to Z'
};
