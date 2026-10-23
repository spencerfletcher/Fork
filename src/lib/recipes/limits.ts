// Shared by the server schema and the live editor, so the browser can refuse
// to parse what the server would reject. parse-ingredient's run time grows
// with the square of a line's length, so a line is capped before it reaches
// the parser; the whole field is capped so a save cannot carry an arbitrarily
// large body.
export const MAX_LINE = 300;
export const MAX_FIELD = 20_000;

export const FIELD_TOO_LONG = (label: string) =>
	`${label} are too long (${MAX_FIELD.toLocaleString('en-US')} characters max)`;
export const LINE_TOO_LONG = `An ingredient line is too long (${MAX_LINE} characters max)`;

/** The limit message for a field's raw text, or null when it is within bounds. */
export function limitError(text: string, label: string, perLine: boolean): string | null {
	if (text.length > MAX_FIELD) return FIELD_TOO_LONG(label);
	if (perLine && text.split('\n').some((line) => line.length > MAX_LINE)) return LINE_TOO_LONG;
	return null;
}
