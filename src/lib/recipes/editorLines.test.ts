import { describe, test, expect } from 'vitest';
import { lineKind, headingInsert, SECTION_NAME } from './editorLines.js';

describe('lineKind', () => {
	test('a "# Name" line is a heading, with or without leading space', () => {
		expect(lineKind('# Spice')).toBe('heading');
		expect(lineKind('  # To finish')).toBe('heading');
	});

	test('a bare # or "# " is a heading still to be named, so it never grows', () => {
		expect(lineKind('#')).toBe('unnamed');
		expect(lineKind('# ')).toBe('unnamed');
	});

	// contenteditable types a trailing space as a no-break space.
	test('reads a no-break space as a space', () => {
		expect(lineKind('#\u00a0')).toBe('unnamed');
		expect(lineKind('#\u00a0Spice')).toBe('heading');
	});

	test('"#2 can" and ordinary lines are text', () => {
		expect(lineKind('#2 can tomatoes')).toBe('text');
		expect(lineKind('2 cups flour')).toBe('text');
		expect(lineKind('')).toBe('text');
	});
});

describe('headingInsert', () => {
	const TEXT = `# ${SECTION_NAME}`;

	test('on an empty line, the heading fills it', () => {
		expect(headingInsert('', 0)).toEqual({ text: TEXT, at: 'caret', above: false });
		expect(headingInsert('  ', 1)).toEqual({ text: TEXT, at: 'caret', above: false });
	});

	test('at the start of a line, it goes above the line', () => {
		expect(headingInsert('2 cups flour', 0)).toEqual({
			text: `${TEXT}\n`,
			at: 'caret',
			above: true
		});
	});

	test('mid-line or at the end, it goes on a new line below, so no line is split', () => {
		expect(headingInsert('2 cups flour', 4)).toEqual({
			text: `\n${TEXT}`,
			at: 'lineEnd',
			above: false
		});
		expect(headingInsert('2 cups flour', 12).at).toBe('lineEnd');
	});
});
