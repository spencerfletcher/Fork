// Decides whether a saved recipe differs from what the user submitted, from
// the authored fields only. Parser output (quantities, units) and derived data
// (gram weights) never take part, so a wording change counts even when the
// parser reads the same quantity, and a parser upgrade never creates a version.
import type { RecipeContent } from './types.js';

// The groups a change is reported under, in the order the generated commit
// message lists them. Both minute fields fold into one "times" group.
export const CONTENT_GROUPS = [
	'title',
	'description',
	'servings',
	'times',
	'ingredients',
	'steps'
] as const;
export type ContentGroup = (typeof CONTENT_GROUPS)[number];

// Shared with diffMeta, so the diff and the "did it change" decision agree.
export const normaliseTitle = (title: string): string => title.trim();
export const normaliseDescription = (description: string | null): string | null =>
	description?.trim() || null;

// One comparable value per group. Record<ContentGroup, …> means a new group
// without a view is a type error.
const VIEW: Record<ContentGroup, (c: RecipeContent) => unknown> = {
	title: (c) => normaliseTitle(c.title),
	description: (c) => normaliseDescription(c.description),
	servings: (c) => c.servings,
	times: (c) => [c.prepTimeMinutes, c.cookTimeMinutes],
	ingredients: (c) => c.ingredients.map((i) => i.text),
	steps: (c) => c.steps.map((s) => [s.text, s.annotation?.type ?? '', s.annotation?.text ?? ''])
};

/** The groups whose value differs, in CONTENT_GROUPS order. */
export function changedGroups(from: RecipeContent, to: RecipeContent): ContentGroup[] {
	function same(group: ContentGroup, from: RecipeContent, to: RecipeContent) {
		const view = VIEW[group];
		return JSON.stringify(view(from)) === JSON.stringify(view(to));
	}
	return CONTENT_GROUPS.filter((group) => !same(group, from, to));
}

/** Whether a save should write a new version. */
export function contentChanged(from: RecipeContent, to: RecipeContent): boolean {
	return changedGroups(from, to).length > 0;
}

/** The commit message used when the user leaves it blank, e.g. "Updated servings, ingredients". */
export function generatedCommitMessage(groups: ContentGroup[]): string {
	return 'Updated ' + groups.join(', ');
}
