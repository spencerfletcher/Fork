import { describe, test, expect } from 'vitest';
import { formatDate, formatTime } from './helpers';

describe('formatTime', () => {
	test('under an hour reads in minutes', () => {
		expect(formatTime(45)).toBe('45 min');
	});

	test('whole hours drop the minutes', () => {
		expect(formatTime(120)).toBe('2h');
	});

	test('hours and minutes read "1h 30m"', () => {
		expect(formatTime(90)).toBe('1h 30m');
	});
});

describe('formatDate', () => {
	const date = new Date(2026, 1, 28);

	test('day, short month and year in British order by default', () => {
		expect(formatDate(date)).toBe('28 Feb 2026');
	});

	test('takes other parts in the same locale', () => {
		expect(formatDate(date, { month: 'long', year: 'numeric' })).toBe('February 2026');
	});
});
