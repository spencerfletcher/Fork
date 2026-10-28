// What a save of the form's current draft would write, in the same groups the
// server reports, so the helper line and the placeholder agree with the commit
// message the server generates.
import { CONTENT_GROUPS, changedGroups, type ContentGroup } from './content.js';
import { parseDraftContent, type RecipeDraft } from './validation.js';

/** Content groups that differ between the loaded draft and the edited one. */
export function draftChangedGroups(
	baseline: RecipeDraft,
	draft: RecipeDraft,
	photoChanged: boolean
): ContentGroup[] {
	const from = parseDraftContent(baseline);
	const to = parseDraftContent(draft);
	// An invalid draft has no outcome to describe; the server's error says why.
	if (!from.ok || !to.ok) return [];
	const changed = changedGroups({ ...from.value, imageUrl: null }, { ...to.value, imageUrl: null });
	return CONTENT_GROUPS.filter((g) => (g === 'photo' ? photoChanged : changed.includes(g)));
}

/** "servings, ingredients and steps" */
export function describeGroups(groups: ContentGroup[]): string {
	if (groups.length < 2) return groups.join('');
	return groups.slice(0, -1).join(', ') + ' and ' + groups[groups.length - 1];
}
