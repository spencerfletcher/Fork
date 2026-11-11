import { describe, test, expect } from 'vitest';
import { summaryMonths } from '#lib/journal.js';
import { TZ_COOKIE } from '#lib/timeZone.js';
import { MAX_ZONE_LENGTH, todayFor } from './timeZone';

const jar = (value?: string) => ({
	get: (name: string) => (name === TZ_COOKIE ? value : undefined)
});

// 4 pm Pacific on the last day of November is already 1 December in UTC.
const PACIFIC_4PM = new Date('2026-12-01T00:00:00Z');

describe('todayFor', () => {
	test('a valid zone gives the cook’s own calendar day, and the summary its month', () => {
		const today = todayFor(jar('America/Los_Angeles'), PACIFIC_4PM);
		expect(today).toBe('2026-11-30');
		expect(summaryMonths(today).at(-1)).toBe('2026-11-01');
	});

	test('a zone ahead of UTC moves the day forward', () => {
		expect(todayFor(jar('Pacific/Auckland'), new Date('2026-11-12T12:00:00Z'))).toBe('2026-11-13');
	});

	test('absent, garbage or overlong falls back to UTC', () => {
		const utc = '2026-12-01';
		expect(todayFor(jar(), PACIFIC_4PM)).toBe(utc);
		expect(todayFor(jar(''), PACIFIC_4PM)).toBe(utc);
		expect(todayFor(jar('Mars/Olympus_Mons'), PACIFIC_4PM)).toBe(utc);
		expect(todayFor(jar('UTC; path=/'), PACIFIC_4PM)).toBe(utc);
		expect(todayFor(jar('x'.repeat(MAX_ZONE_LENGTH * 100)), PACIFIC_4PM)).toBe(utc);
	});
});
