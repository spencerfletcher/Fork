import type { RecipeContent } from './types.js';

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

const VIEW: Record<ContentGroup, (c: RecipeContent) => unknown> = {
	title: (c) => normaliseTitle(c.title),
	description: (c) => normaliseDescription(c.description),
	servings: (c) => c.servings,
	times: (c) => [c.prepTimeMinutes, c.cookTimeMinutes],
	ingredients: (c) => c.ingredients.map((i) => i.text),
	steps: (c) => c.steps.map((s) => [s.text, s.annotation?.type ?? '', s.annotation?.text ?? ''])
};

export function changedGroups(from: RecipeContent, to: RecipeContent): ContentGroup[] {
	function same(group: ContentGroup, from: RecipeContent, to: RecipeContent) {
		const view = VIEW[group];
		return JSON.stringify(view(from)) === JSON.stringify(view(to));
	}
	return CONTENT_GROUPS.filter((group) => !same(group, from, to));
}

export function contentChanged(from: RecipeContent, to: RecipeContent): boolean {
	return changedGroups(from, to).length > 0;
}

export function generatedCommitMessage(groups: ContentGroup[]): string {
	return 'Updated ' + groups.join(', ');
}
