import { error } from '@sveltejs/kit';
import type { Step, StepAnnotationType } from '#lib/recipes/types.js';

const ANNOTATION_TYPES: readonly StepAnnotationType[] = ['tip', 'warning', 'substitution'];

export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnnotationType(value: unknown): value is StepAnnotationType {
	return typeof value === 'string' && (ANNOTATION_TYPES as readonly string[]).includes(value);
}

/**
 * Rebuilds steps from client-submitted JSON: numbers them from 1 and keeps
 * only known fields. An annotation survives only with a known type and
 * non-empty text, since it comes from the client and is rendered to readers.
 */
export function normalizeSteps(raw: unknown[]): Step[] {
	return raw.map((s, i) => {
		if (!isObject(s)) throw error(400, `Step ${i + 1} is invalid`);
		const text = typeof s.text === 'string' ? s.text.trim() : '';
		if (!text) throw error(400, `Step ${i + 1} needs text`);
		const step: Step = { step: i + 1, text };
		if (isObject(s.annotation)) {
			const type = s.annotation.type;
			const note = typeof s.annotation.text === 'string' ? s.annotation.text.trim() : '';
			if (isAnnotationType(type) && note) step.annotation = { type, text: note };
		}
		return step;
	});
}
