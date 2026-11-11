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
	'photo',
	'servings',
	'yield',
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
	photo: (c) => c.imageUrl,
	servings: (c) => c.servings,
	yield: (c) => c.makes,
	times: (c) => [c.prepTimeMinutes, c.cookTimeMinutes],
	// The group is part of a row, so moving a line or renaming its heading counts.
	ingredients: (c) => c.ingredients.map((i) => [i.group ?? '', i.text]),
	steps: (c) =>
		c.steps.map((s) => [s.group ?? '', s.text, s.annotation?.type ?? '', s.annotation?.text ?? ''])
};

/** The groups whose value differs, in CONTENT_GROUPS order. */
export function changedGroups(from: RecipeContent, to: RecipeContent): ContentGroup[] {
	function same(group: ContentGroup, from: RecipeContent, to: RecipeContent) {
		const view = VIEW[group];
		return JSON.stringify(view(from)) === JSON.stringify(view(to));
	}
	return CONTENT_GROUPS.filter((group) => !same(group, from, to));
}

/** The commit message used when the user leaves it blank, e.g. "Updated servings, ingredients". */
export function generatedCommitMessage(groups: ContentGroup[]): string {
	return 'Updated ' + groups.join(', ');
}

/** The commit message of a version that brings back an older one's content, e.g. "Restore v2". */
export function restoredCommitMessage(versionNumber: number): string {
	return `Restore v${versionNumber}`;
}

/** A version's content alone, without its number, message or authorship. */
export function versionContent(version: RecipeContent): RecipeContent {
	const { makes, ingredients, steps } = version;
	return { ...recipeCopies(version), makes, ingredients, steps };
}

/**
 * The content the recipe row keeps a copy of (schema.ts), for create, edit and
 * fork alike. Ingredients, steps and makes live on versions only.
 */
export function recipeCopies({
	title,
	description,
	servings,
	prepTimeMinutes,
	cookTimeMinutes,
	imageUrl
}: Pick<
	RecipeContent,
	'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'imageUrl'
>) {
	return { title, description, servings, prepTimeMinutes, cookTimeMinutes, imageUrl };
}
