import { STEP_ANNOTATION_TYPES, type Step, type StepAnnotationType } from './types.js';

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

export function parseStepText(text: string): Step[] {
	return text
		.replace(/\r\n/g, '\n')
		.trim()
		.split(/\n\s*\n/)
		.filter((block) => block.trim().length > 0)
		.map(parseBlock);
}

export function stepsToText(steps: Step[]): string {
	return steps
		.map((step) =>
			step.annotation ? `${step.text}\n${step.annotation.type}: ${step.annotation.text}` : step.text
		)
		.join('\n\n');
}
