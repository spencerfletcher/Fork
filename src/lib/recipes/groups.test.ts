import { describe, test, expect } from 'vitest';
import { splitGroups } from './groups';

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
