import {
	STEP_ANNOTATION_TYPES,
	type Step,
	type StepAnnotation,
	type StepAnnotationType
} from './types.js';

const KEYWORD = new RegExp(`^(${STEP_ANNOTATION_TYPES.join('|')}):\\s*(.*)$`, 'i');

function isAnnotationType(value: string): value is StepAnnotationType {
	return (STEP_ANNOTATION_TYPES as readonly string[]).includes(value);
}

function parseBlock(block: string): Step {
	const lines = block.split('\n');
	const textLines: string[] = [];
	let annotation: StepAnnotation | undefined;
	let annotationLine: string | undefined;

	lines.forEach((line, i) => {
		const match = i > 0 ? KEYWORD.exec(line.trim()) : null;
		if (!match) {
			textLines.push(line);
			return;
		}
		if (annotationLine !== undefined) textLines.push(annotationLine);
		const keyword = match[1].toLowerCase();
		const note = match[2].trim();
		annotation = isAnnotationType(keyword) && note ? { type: keyword, text: note } : undefined;
		annotationLine = line;
	});

	const text = textLines.join('\n').trim();
	return annotation ? { text, annotation } : { text };
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
