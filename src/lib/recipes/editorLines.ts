// The live ingredient and step boxes, line by line: which lines draw as a
// heading while typing, and where Insert → Section heading puts its line.
// The heading test is the parser's own (splitGroups), so the box can never
// style a line the save would read differently.

import { splitGroups } from './groups.js';

/** 'heading' grows; 'unnamed' ("#", "# ") only softens its mark, so the
 *  line does not jump while the name is still to be typed. */
export type LineKind = 'heading' | 'unnamed' | 'text';

export function lineKind(line: string): LineKind {
	const heading = splitGroups(line).find((s) => s.group !== undefined);
	if (!heading) return 'text';
	return heading.group === '' ? 'unnamed' : 'heading';
}

/** The words Insert selects, so typing replaces them. */
export const SECTION_NAME = 'Section name';

/** What Insert → Section heading types, and where. On an empty line it fills
 *  the line; at a line's start it goes above it; anywhere else the caret
 *  first moves to the line's end, so no ingredient is split. */
export function headingInsert(
	lineText: string,
	caret: number
): { text: string; at: 'caret' | 'lineEnd'; above: boolean } {
	const heading = `# ${SECTION_NAME}`;
	if (lineText.trim() === '') return { text: heading, at: 'caret', above: false };
	if (caret === 0) return { text: `${heading}\n`, at: 'caret', above: true };
	return { text: `\n${heading}`, at: 'lineEnd', above: false };
}
