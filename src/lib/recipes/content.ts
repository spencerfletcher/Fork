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

const VIEW: Record<ContentGroup, (c: RecipeContent) => unknown> = {
	title: (c) => c.title.trim(),
	description: (c) => c.description?.trim() || null,
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
