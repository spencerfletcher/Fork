import { describe, test, expect } from 'vitest';
import { formatDate, formatTime, oneOf, plural, wholeNumber } from './helpers';

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

describe('plural', () => {
	test('one takes the noun as it is; any other count adds an s', () => {
		expect(plural(1, 'fork')).toBe('1 fork');
		expect(plural(0, 'fork')).toBe('0 forks');
		expect(plural(2, 'public recipe')).toBe('2 public recipes');
	});
});

describe('oneOf', () => {
	const LIST = ['all', 'mine', 'saved'] as const;

	test('a member of the list is itself', () => {
		for (const item of LIST) expect(oneOf(LIST, item)).toBe(item);
	});

	test('anything else, missing included, is undefined', () => {
		expect(oneOf(LIST, 'Mine')).toBeUndefined();
		expect(oneOf(LIST, '')).toBeUndefined();
		expect(oneOf(LIST, null)).toBeUndefined();
	});
});

describe('wholeNumber', () => {
	test('digits only read as their number', () => {
		expect(wholeNumber('0')).toBe(0);
		expect(wholeNumber('42')).toBe(42);
	});

	test('signs, decimals, spaces, trailing letters and empty are null', () => {
		for (const value of ['-1', '+1', '1.5', ' 1', '2abc', '1e3', ''])
			expect(wholeNumber(value)).toBeNull();
	});
});
