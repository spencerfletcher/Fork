// The words of a recipe a moderator hid (recipes.suppressedAt), shared by the
// recipe page's actions and its notice.

/** The notice's label, at the top of the recipe page, for its author. */
export const HIDDEN_NOTICE = 'Hidden from other cooks by Fork.';

/** What the author can still do, under the label. */
export const HIDDEN_NOTE =
	'Only you can see it now. You can still read, cook and edit it, and it comes with your data when you download it.';

/** What Fork and Save are told on a hidden recipe. */
export const HIDDEN_REFUSED =
	'This recipe is hidden from other cooks, so it can’t be saved or forked.';

/** The longest report anyone writes, from the feed's menus or /report, in characters. */
export const MAX_REPORT = 1000;

/** The /report form's hidden trap field: a person never sees it, a form-filling bot fills it. */
export const REPORT_HONEYPOT = 'website';
