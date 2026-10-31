import { describe, test, expect } from 'vitest';
import { LINE_TOO_LONG, MAX_FIELD, MAX_LINE, fieldTooLong, limitError } from './limits';

describe('limitError', () => {
	const longLine = 'x'.repeat(MAX_LINE + 1);

	test('an ingredient line past the cap is refused; a step line is not', () => {
		expect(limitError(longLine, 'Ingredients')).toBe(LINE_TOO_LONG);
		expect(limitError(longLine, 'Steps')).toBeNull();
	});

	test('either field past the whole-field cap names itself', () => {
		const long = 'x\n'.repeat(MAX_FIELD / 2 + 1);
		expect(limitError(long, 'Steps')).toBe(fieldTooLong('Steps'));
		expect(limitError(long, 'Ingredients')).toBe(fieldTooLong('Ingredients'));
	});
});
