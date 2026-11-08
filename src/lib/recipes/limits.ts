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
export const MAX_MAKES = 80;
export const MAKES_TOO_LONG = `Makes is too long (${MAX_MAKES} characters max)`;

/** The limit message for a field's raw text, or null when it is within bounds.
 *  Only ingredient lines reach the parser, so only they are capped per line. */
export function limitError(text: string, label: 'Ingredients' | 'Steps'): string | null {
	if (text.length > MAX_FIELD) return fieldTooLong(label);
	const perLine = label === 'Ingredients';
	if (perLine && text.split('\n').some((line) => line.length > MAX_LINE)) return LINE_TOO_LONG;
	return null;
}
