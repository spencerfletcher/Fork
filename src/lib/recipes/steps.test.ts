import { describe, test, expect } from 'vitest';
import { normalizeSteps } from './steps';

describe('normalizeSteps', () => {
	test('renumbers steps sequentially from 1', () => {
		const result = normalizeSteps([
			{ step: 4, text: 'Mix.' },
			{ step: 9, text: 'Bake.' }
		]);
		expect(result).toEqual([
			{ step: 1, text: 'Mix.' },
			{ step: 2, text: 'Bake.' }
		]);
	});

	test('keeps a valid annotation', () => {
		const result = normalizeSteps([
			{ step: 1, text: 'Bake.', annotation: { type: 'warning', text: 'Oven runs hot.' } }
		]);
		expect(result[0].annotation).toEqual({ type: 'warning', text: 'Oven runs hot.' });
	});

	test('trims annotation text', () => {
		const result = normalizeSteps([
			{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '  Use parchment.  ' } }
		]);
		expect(result[0].annotation).toEqual({ type: 'tip', text: 'Use parchment.' });
	});

	test('drops an annotation with empty text', () => {
		const result = normalizeSteps([
			{ step: 1, text: 'Bake.', annotation: { type: 'tip', text: '   ' } }
		]);
		expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
	});

	test('drops an annotation with an unknown type', () => {
		const result = normalizeSteps([
			{ step: 1, text: 'Bake.', annotation: { type: 'script', text: 'x' } }
		]);
		expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
	});

	test('ignores fields other than step text and annotation', () => {
		const result = normalizeSteps([{ step: 1, text: 'Bake.', injected: true }]);
		expect(result[0]).toEqual({ step: 1, text: 'Bake.' });
	});

	test('throws 400 on a null step', () => {
		expect(() => normalizeSteps([null])).toThrow(expect.objectContaining({ status: 400 }));
	});
	test('throws 400 on a step without string text', () => {
		expect(() => normalizeSteps([{ text: 42 }])).toThrow(expect.objectContaining({ status: 400 }));
	});
	test('ignores an annotation that is not an object', () => {
		expect(normalizeSteps([{ text: 'chop', annotation: 'tip' }])).toEqual([
			{ step: 1, text: 'chop' }
		]);
	});
});
