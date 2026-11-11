// Search highlighting. Postgres's ts_headline wraps each matched word in two
// control characters rather than HTML, so the page renders the runs as text
// (escaped by Svelte) and never needs {@html} on a recipe's words.

export const MARK_START = '\u0001';
export const MARK_END = '\u0002';

/** Why a search result matched: its title with the words marked, and, when the title does not show it, where it matched. */
export type SearchMatch = { title: string; label?: string; text?: string };

/** Marked text as runs, each plain or marked; the markers themselves are dropped. */
export function segments(marked: string): { text: string; mark: boolean }[] {
	const runs: { text: string; mark: boolean }[] = [];
	let mark = false;
	for (const part of marked.split(new RegExp(`(${MARK_START}|${MARK_END})`))) {
		if (part === MARK_START) mark = true;
		else if (part === MARK_END) mark = false;
		else if (part) runs.push({ text: part, mark });
	}
	return runs;
}
