// The phone editor's folded facts, in words: derived from the draft as it is
// typed, never stored. The yield as entered and the audience lead, so they
// survive the two-line clamp; the rest follow as they fit.
import { AUDIENCE_LABEL } from '#lib/audience.js';
import { plural } from '#lib/helpers.js';
import { readDuration, timeSpans, TIME_FIELDS, type TimeField } from './times.js';
import { readSourceUrl, sourceLabel, type RecipeDraft } from './validation.js';

export function factsSummary(
	draft: RecipeDraft,
	hasPhoto: boolean
): { facts: string[]; action: 'Add details' | 'Edit details' } {
	// A time the field refuses is left out; its own box says why.
	const minutes = (field: TimeField) => {
		const read = readDuration(draft[field]);
		return read.ok ? read.minutes : null;
	};
	const times = timeSpans(
		Object.fromEntries((Object.keys(TIME_FIELDS) as TimeField[]).map((f) => [f, minutes(f)]))
	);
	const link = readSourceUrl(draft.sourceUrl);
	const source = sourceLabel(draft.sourceName.trim() || null, link.ok ? link.url : null);

	const set = [
		...times.map(({ value, word }) => `${value} ${word}`),
		draft.tags.length > 0 && plural(draft.tags.length, 'tag'),
		hasPhoto && 'Photo',
		source
	].filter((fact): fact is string => !!fact);
	const yields = [
		draft.servings.trim() && `Serves ${draft.servings.trim()}`,
		draft.makes.trim() && `Makes ${draft.makes.trim()}`
	].filter((fact): fact is string => !!fact);

	const audience = AUDIENCE_LABEL[draft.visibility];
	if (yields.length === 0 && set.length === 0)
		return { facts: [audience, 'No photo, times or tags yet'], action: 'Add details' };
	return { facts: [...yields, audience, ...set], action: 'Edit details' };
}
