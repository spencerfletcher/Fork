// Shared by the server schema and the live editor, so the browser can refuse
// to parse what the server would reject. parse-ingredient's run time grows
// with the square of a line's length, so a line is capped before it reaches
// the parser; the whole field is capped so a save cannot carry an arbitrarily
// large body.
export const MAX_LINE = 300;
export const MAX_FIELD = 20_000;

export const fieldTooLong = (label: string) =>
	`${label} are too long (${MAX_FIELD.toLocaleString('en-US')} characters max)`;
export const LINE_TOO_LONG = `An ingredient line is too long (${MAX_LINE} characters max)`;

// A group name is a heading and a yield one phrase of the measure line; both
// are short by nature, so the caps only stop a paste gone wrong.
export const MAX_GROUP_NAME = 60;
export const groupNameTooLong = (items: 'ingredients' | 'steps') =>
	`${items === 'ingredients' ? 'An ingredient' : 'A step'} group name is too long (${MAX_GROUP_NAME} characters max)`;

/** The free-text content fields: the label their message names and their cap.
 *  The short ones are a phrase each; notes are paragraphs. */
export const TEXT_LIMITS = {
	makes: { label: 'Makes', max: 80 },
	sourceName: { label: 'Source', max: 120 },
	makeAhead: { label: 'Make ahead', max: 200 },
	equipment: { label: 'Equipment', max: 300 },
	storage: { label: 'Storage', max: 300 },
	reheating: { label: 'Reheating', max: 300 },
	notes: { label: 'Notes', max: 4000 }
} as const;
export type TextField = keyof typeof TEXT_LIMITS;
export const textTooLong = (field: TextField) => {
	const { label, max } = TEXT_LIMITS[field];
	return `${label} ${field === 'notes' ? 'are' : 'is'} too long (${max.toLocaleString('en-US')} characters max)`;
};
export const MAX_MAKES = TEXT_LIMITS.makes.max;
export const MAKES_TOO_LONG = textTooLong('makes');

/** A source link's cap, as typed: room for any real address. */
export const MAX_SOURCE_URL = 2000;

/** The limit message for a field's raw text, or null when it is within bounds.
 *  Only ingredient lines reach the parser, so only they are capped per line. */
export function limitError(text: string, label: 'Ingredients' | 'Steps'): string | null {
	if (text.length > MAX_FIELD) return fieldTooLong(label);
	const perLine = label === 'Ingredients';
	if (perLine && text.split('\n').some((line) => line.length > MAX_LINE)) return LINE_TOO_LONG;
	return null;
}
