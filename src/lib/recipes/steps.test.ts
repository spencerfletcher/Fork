import { describe, test, expect } from 'vitest';
import { parseStepText, stepsToText } from './steps';
import { inGroup, makeStep } from './fixtures';

const EXAMPLE = [
	'Cream the butter and sugars until pale.',
	'Scrape the bowl once.',
	'',
	'Fold in the flour.',
	'tip: Stop as soon as no dry streaks remain.',
	'',
	'Bake 12 minutes.',
	'warning: Oven runs hot, check at 10.'
].join('\n');

describe('parseStepText', () => {
	test('parses the spec example into three numbered steps', () => {
		expect(parseStepText(EXAMPLE)).toEqual([
			{ text: 'Cream the butter and sugars until pale.\nScrape the bowl once.' },
			{
				text: 'Fold in the flour.',
				annotation: { type: 'tip', text: 'Stop as soon as no dry streaks remain.' }
			},
			{
				text: 'Bake 12 minutes.',
				annotation: { type: 'warning', text: 'Oven runs hot, check at 10.' }
			}
		]);
	});

	test('keywords are case-insensitive', () => {
		expect(parseStepText('Mix.\nTIP: gently')[0].annotation).toEqual({
			type: 'tip',
			text: 'gently'
		});
	});

	test('substitution: is kept as its own type', () => {
		expect(parseStepText('Mix.\nsubstitution: use oil')[0].annotation).toEqual({
			type: 'substitution',
			text: 'use oil'
		});
	});

	test('an empty annotation line stays in the text, so a save does not change it', () => {
		expect(parseStepText('Mix.\ntip:   ')).toEqual([{ text: 'Mix.\ntip:' }]);
	});

	test('a keyword line that is not last is step text, in place', () => {
		expect(parseStepText('Mix.\ntip: a\nStir.')).toEqual([{ text: 'Mix.\ntip: a\nStir.' }]);
	});

	test('a keyword on the first line of a block is step text', () => {
		expect(parseStepText('tip: this is a step')).toEqual([{ text: 'tip: this is a step' }]);
	});

	test('only the last annotation line counts; earlier ones stay in the text', () => {
		expect(parseStepText('Mix.\ntip: a\ntip: b')).toEqual([
			{ text: 'Mix.\ntip: a', annotation: { type: 'tip', text: 'b' } }
		]);
	});

	test('multiple blank lines and \\r\\n separate blocks', () => {
		expect(parseStepText('A.\r\n\r\n\r\n\r\nB.').map((s) => s.text)).toEqual(['A.', 'B.']);
	});

	test('a line of only spaces still separates blocks', () => {
		expect(parseStepText('A.\n   \nB.').map((s) => s.text)).toEqual(['A.', 'B.']);
	});

	test('whitespace-only text gives no steps', () => {
		expect(parseStepText(' \n\n ')).toEqual([]);
	});

	test('a transcribed list loses its numbers: the page numbers steps itself', () => {
		expect(parseStepText('1. Cream the butter.\n\n2) Fold in the flour.')).toEqual([
			{ text: 'Cream the butter.' },
			{ text: 'Fold in the flour.' }
		]);
	});

	test('a number with nothing after it is no step', () => {
		expect(parseStepText('Mix.\n\n2. \n\nBake.')).toEqual([{ text: 'Mix.' }, { text: 'Bake.' }]);
	});

	test('a numbered line starts a step even without a blank line before it', () => {
		expect(parseStepText('1. Mix.\ntip: gently\n2. Rest 10 minutes.\n3.  Bake.')).toEqual([
			{ text: 'Mix.', annotation: { type: 'tip', text: 'gently' } },
			{ text: 'Rest 10 minutes.' },
			{ text: 'Bake.' }
		]);
	});

	test('a number that is not a list marker stays: a decimal, or one mid-step', () => {
		expect(parseStepText('1.5 cups of milk, warmed.\nHeat to 180.')).toEqual([
			{ text: '1.5 cups of milk, warmed.\nHeat to 180.' }
		]);
	});
});

describe('stepsToText', () => {
	test('round-trips the spec example', () => {
		expect(stepsToText(parseStepText(EXAMPLE))).toBe(EXAMPLE);
	});

	test.each([
		['notes between instructions', 'Mix.\ntip: a\nStir.\ntip: b'],
		['two annotation types', 'Mix.\nwarning: hot\nStir.\nsubstitution: oil'],
		['an empty final annotation after a real one', 'Mix.\ntip: a\ntip:'],
		['an ordinary multiline step', 'Mix.\nStir.\nRest.'],
		['a first line that looks like a keyword', 'tip: this is a step\ntip: b']
	])('a second save changes nothing: %s', (_, input) => {
		const parsed = parseStepText(input);
		expect(parseStepText(stepsToText(parsed))).toEqual(parsed);
	});
});

describe('grouped steps', () => {
	test('a "# Name" line groups the steps under it, with or without a blank line after it', () => {
		const steps = parseStepText(
			'Preheat.\n\n# Make the dough\nMix.\ntip: Gently.\n\nKnead.\n\n# Bake\n\nBake 20 minutes.'
		);
		expect(steps).toEqual([
			{ text: 'Preheat.' },
			{ text: 'Mix.', annotation: { type: 'tip', text: 'Gently.' }, group: 'Make the dough' },
			{ text: 'Knead.', group: 'Make the dough' },
			{ text: 'Bake 20 minutes.', group: 'Bake' }
		]);
	});

	test('stepsToText writes a "# Name" line where the group changes, and reads back the same', () => {
		const steps = [
			makeStep('Preheat.'),
			...inGroup('Make the dough', [
				makeStep('Mix.', { type: 'tip', text: 'Gently.' }),
				makeStep('Knead.')
			]),
			...inGroup('Bake', [makeStep('Bake.')])
		];
		const text = stepsToText(steps);
		expect(text).toBe(
			'Preheat.\n\n# Make the dough\nMix.\ntip: Gently.\n\nKnead.\n\n# Bake\nBake.'
		);
		expect(parseStepText(text)).toEqual(steps);
	});

	test('a heading ends the step above it even with no blank line between', () => {
		expect(parseStepText('Mix.\n# Bake\nBake.').map((s) => [s.group, s.text])).toEqual([
			[undefined, 'Mix.'],
			['Bake', 'Bake.']
		]);
	});
});
