import type { Step, StepAnnotationType } from './db/schema.js';

const ANNOTATION_TYPES: readonly StepAnnotationType[] = ['tip', 'warning', 'substitution'];

// Parsed client JSON: any extra fields are allowed in, and dropped on the way out.
type RawStep = { text: string; annotation?: { type?: unknown; text?: unknown } } & Record<
	string,
	unknown
>;

/**
 * Rebuilds steps from client-submitted JSON: numbers them from 1 and keeps
 * only known fields. An annotation survives only with a known type and
 * non-empty text, since it comes from the client and is rendered to readers.
 */
export function normalizeSteps(raw: RawStep[]): Step[] {
	return raw.map((s, i) => {
		const step: Step = { step: i + 1, text: s.text };
		const type = s.annotation?.type;
		const text = typeof s.annotation?.text === 'string' ? s.annotation.text.trim() : '';
		if (ANNOTATION_TYPES.includes(type as StepAnnotationType) && text) {
			step.annotation = { type: type as StepAnnotationType, text };
		}
		return step;
	});
}
