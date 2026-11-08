import { describe, test, expect } from 'vitest';
import { readBack, splitGroups } from './groups';
import { parseIngredientGroups } from './ingredients';
import { parseStepGroups } from './steps';

describe('splitGroups', () => {
	test('text with no # line is one ungrouped section, as typed', () => {
		expect(splitGroups('1 cup flour\n2 eggs')).toEqual([
			{ group: undefined, text: '1 cup flour\n2 eggs' }
		]);
	});

	test('a "# Name" line starts a named section; lines before it have no group', () => {
		expect(splitGroups('salt\n# Dough\n1 cup flour\n\n#  To finish \nsugar')).toEqual([
			{ group: undefined, text: 'salt' },
			{ group: 'Dough', text: '1 cup flour\n' },
			{ group: 'To finish', text: 'sugar' }
		]);
	});

	test('the leading ungrouped section is dropped when nothing is in it', () => {
		expect(splitGroups('\n# Dough\nflour').map((s) => s.group)).toEqual(['Dough']);
	});

	test('a heading with nothing under it is kept, so it can be reported', () => {
		expect(splitGroups('# Dough\nflour\n# Filling\n\n# Icing\nsugar')).toEqual([
			{ group: 'Dough', text: 'flour' },
			{ group: 'Filling', text: '' },
			{ group: 'Icing', text: 'sugar' }
		]);
	});

	test('# needs a space after it, so "#10 can" and a bare "#" stay lines', () => {
		expect(splitGroups('1 #10 can tomatoes\n#10 can beans\n#')).toEqual([
			{ group: undefined, text: '1 #10 can tomatoes\n#10 can beans\n#' }
		]);
	});

	test('Windows line endings are tolerated', () => {
		expect(splitGroups('# Dough\r\nflour')).toEqual([{ group: 'Dough', text: 'flour' }]);
	});
});

describe('readBack', () => {
	test('ingredients: the groups and their line counts', () => {
		expect(
			readBack(parseIngredientGroups('# Dough\nflour\neggs\n# To finish\nsalt'), 'ingredients')
		).toEqual({
			lead: 'Reads as 2 groups:',
			parts: [
				{ name: 'Dough', detail: '2 lines' },
				{ name: 'To finish', detail: '1 line' }
			]
		});
	});

	test('steps: the step count, and each group its step numbers, counted straight through', () => {
		const text =
			'# Make the dough\nMix.\n\nKnead.\n\nRest.\n\nShape.\n\n# Bake\nBake.\n\nCool.\n\n# Serve\nEat.';
		expect(readBack(parseStepGroups(text), 'steps')).toEqual({
			lead: 'Reads as 7 steps in 3 groups:',
			parts: [
				{ name: 'Make the dough', detail: '1–4' },
				{ name: 'Bake', detail: '5–6' },
				{ name: 'Serve', detail: '7' }
			]
		});
	});

	test('an empty heading reads "empty"; lines before the first heading read as ungrouped', () => {
		expect(
			readBack(parseIngredientGroups('salt\n# Filling\n# Icing\nsugar'), 'ingredients')
		).toEqual({
			lead: 'Reads as 2 groups:',
			parts: [
				{ name: undefined, detail: '1 line' },
				{ name: 'Filling', detail: 'empty' },
				{ name: 'Icing', detail: '1 line' }
			]
		});
	});

	test('no heading, no read-back', () => {
		expect(readBack(parseIngredientGroups('flour\neggs'), 'ingredients')).toBeNull();
		expect(readBack(parseStepGroups('Mix.\n\nBake.'), 'steps')).toBeNull();
	});
});
