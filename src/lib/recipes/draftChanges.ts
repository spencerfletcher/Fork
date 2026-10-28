// What a save of the form's current draft would write, in the same groups the
// server reports, so the helper line and the placeholder agree with the commit
// message the server generates.
import { CONTENT_GROUPS, changedGroups, type ContentGroup } from './content.js';
import {
	parseDraftContent,
	type ContentFields,
	type RecipeDraft,
	type Result
} from './validation.js';

/**
 * Content groups that differ between the loaded draft and the edited one, or
 * null when the draft would not pass validation: then there is no outcome to
 * describe, and the server's error says why. The baseline is parsed once by
 * the caller (`parseDraftContent`); the draft is parsed here on each call.
 */
export function draftChangedGroups(
	from: Result<ContentFields>,
	draft: RecipeDraft,
	photoChanged: boolean
): ContentGroup[] | null {
	const to = parseDraftContent(draft);
	if (!from.ok || !to.ok) return null;
	const changed = changedGroups({ ...from.value, imageUrl: null }, { ...to.value, imageUrl: null });
	return CONTENT_GROUPS.filter((g) => (g === 'photo' ? photoChanged : changed.includes(g)));
}

/** "servings, ingredients and steps" */
export function describeGroups(groups: ContentGroup[]): string {
	if (groups.length < 2) return groups.join('');
	return groups.slice(0, -1).join(', ') + ' and ' + groups[groups.length - 1];
}
