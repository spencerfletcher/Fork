import { describe, test, expect } from 'vitest';
import { dayLabel, groupByMonth, localToday, marginDay, monthLabel } from './journal';

const NOW = new Date('2026-11-10T12:00:00Z');

describe('dayLabel', () => {
	test('weekday, day and short month, no comma, in this year', () => {
		expect(dayLabel('2026-11-08', NOW)).toBe('Sun 8 Nov');
	});

	test('adds the year when it is not this one', () => {
		expect(dayLabel('2025-12-31', NOW)).toBe('Wed 31 Dec 2025');
	});
});

describe('marginDay and monthLabel', () => {
	test('read the calendar day, whatever the reader’s offset', () => {
		// The client project runs in America/Los_Angeles, where midnight UTC is the day before.
		expect(marginDay('2026-11-01')).toEqual(['1', 'Sun']);
		expect(monthLabel('2026-11-01')).toBe('November 2026');
	});
});

describe('groupByMonth', () => {
	test('splits where the month changes and keeps the order', () => {
		const entries = [
			{ id: 1, cookedOn: '2026-11-08' },
			{ id: 2, cookedOn: '2026-11-04' },
			{ id: 3, cookedOn: '2026-10-31' }
		];
		expect(groupByMonth(entries)).toEqual([
			{ month: 'November 2026', entries: [entries[0], entries[1]] },
			{ month: 'October 2026', entries: [entries[2]] }
		]);
	});
});

describe('localToday', () => {
	test('the local calendar day, zero padded', () => {
		expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
	});
});
