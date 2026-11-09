import { describe, test, expect } from 'vitest';
import { compactCount, THOUSAND, MILLION } from './compactCount';

describe('compactCount', () => {
	test('below a thousand, plain digits', () => {
		expect(compactCount(0)).toBe('0');
		expect(compactCount(THOUSAND - 1)).toBe(String(THOUSAND - 1));
	});

	test('from a thousand, one decimal and k, a trailing .0 dropped', () => {
		expect(compactCount(THOUSAND)).toBe('1k');
		expect(compactCount(1.234 * THOUSAND)).toBe('1.2k');
		expect(compactCount(12 * THOUSAND)).toBe('12k');
	});

	test('rounds down, so a count never reads more than it is or rolls into the next unit', () => {
		expect(compactCount(1.29 * THOUSAND)).toBe('1.2k');
		expect(compactCount(MILLION - 1)).toBe('999.9k');
	});

	test('from a million, the same rule with M', () => {
		expect(compactCount(MILLION)).toBe('1M');
		expect(compactCount(2.5 * MILLION)).toBe('2.5M');
	});
});
