/** The longest private note a saver may keep on a saved recipe; the database holds it too. */
export const NOTE_MAX = 2000;

/** What a note over NOTE_MAX characters is told. */
export const NOTE_TOO_LONG = `Keep the note to ${NOTE_MAX.toLocaleString('en')} characters.`;
