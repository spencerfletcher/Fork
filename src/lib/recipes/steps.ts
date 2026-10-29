// Steps are typed as paragraphs separated by a blank line. A step may end with
// one annotation line, "tip: …", "warning: …" or "substitution: …", which is
// stored apart from the text so the page can style it. Parsing and printing
// are exact inverses, so a save never rewrites what the user typed, with one
// exception: a transcribed list's "1." or "2)" is dropped, since the page
// numbers the steps itself.
import { STEP_ANNOTATION_TYPES, type Step, type StepAnnotationType } from './types.js';

// A list marker at the start of a line: "1. " or "2) ", never "1.5 cups".
const NUMBERED = /^\s*\d+[.)]\s+/;
const BEFORE_NUMBERED = /\n(?=\s*\d+[.)]\s)/;

// Built from the type list so adding an annotation type is one edit in types.ts.
const KEYWORD = new RegExp(`^(${STEP_ANNOTATION_TYPES.join('|')}):\\s*(.*)$`, 'i');

function isAnnotationType(value: string): value is StepAnnotationType {
	return (STEP_ANNOTATION_TYPES as readonly string[]).includes(value);
}

// Only the last line of a block can be an annotation. Every other line is
// step text as typed, so saving a step and reopening it never moves a line.
function parseBlock(block: string): Step {
	const lines = block.split('\n');
	const match = lines.length > 1 ? KEYWORD.exec(lines[lines.length - 1].trim()) : null;
	const keyword = match?.[1].toLowerCase();
	const note = match?.[2].trim();
	if (keyword !== undefined && note && isAnnotationType(keyword)) {
		return {
			text: lines.slice(0, -1).join('\n').trim(),
			annotation: { type: keyword, text: note }
		};
	}
	return { text: lines.join('\n').trim() };
}

/**
 * The textarea's contents to steps: blocks split on blank lines, and on a
 * numbered line, which starts a step of its own; each is parsed by parseBlock
 * with its number dropped.
 */
export function parseStepText(text: string): Step[] {
	return text
		.replace(/\r\n/g, '\n')
		.trim()
		.split(/\n\s*\n/)
		.flatMap((block) => block.split(BEFORE_NUMBERED))
		.filter((block) => block.trim().length > 0)
		.map((block) => parseBlock(block.replace(NUMBERED, '')));
}

/** The inverse of parseStepText, for refilling the editor from a saved version. */
export function stepsToText(steps: Step[]): string {
	return steps
		.map((step) =>
			step.annotation ? `${step.text}\n${step.annotation.type}: ${step.annotation.text}` : step.text
		)
		.join('\n\n');
}
