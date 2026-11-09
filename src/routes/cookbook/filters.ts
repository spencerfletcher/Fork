/** The Cookbook's segmented filter, in display order; `?filter=` holds one. */
export const COOKBOOK_FILTERS = ['all', 'mine', 'saved'] as const;
export type CookbookFilter = (typeof COOKBOOK_FILTERS)[number];
