import { describe, test, expect } from 'vitest';
import { slugify } from '#lib/helpers.js';
import {
	KEEP_SOURCE,
	dayLabel,
	groupByMonth,
	localToday,
	marginDay,
	monthLabel,
	monthTone,
	sourceHref,
	SUMMARY_MONTHS,
	summaryMonths,
	TONE_STEPS
} from './journal';

const NOW = new Date('2026-11-10T12:00:00Z');

describe('dayLabel', () => {
	test('weekday, day and short month, no comma, in this year', () => {
		expect(dayLabel('2026-11-08', NOW)).toBe('Sun 8 Nov');
	});

	test('adds the year when it is not this one', () => {
		expect(dayLabel('2025-12-31', NOW)).toBe('Wed 31 Dec 2025');
	});

	test('a Date reads as its UTC day, the same as that day written out', () => {
		const lateEvening = new Date('2026-11-08T23:30:00Z');
		expect(dayLabel(lateEvening, NOW)).toBe(dayLabel('2026-11-08', NOW));
	});
});

describe('sourceHref', () => {
	test('the recipe, pinned to the version cooked when there is one', () => {
		expect(sourceHref({ slug: 'bread', versionNumber: 3 })).toBe('/recipes/bread?version=3');
		expect(sourceHref({ slug: 'bread', versionNumber: null })).toBe('/recipes/bread');
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

describe('KEEP_SOURCE', () => {
	// Recipe slugs are recipeSlug output: ASCII letters, digits and hyphens only.
	test('can never be a recipe slug', () => {
		expect(slugify(KEEP_SOURCE)).not.toBe(KEEP_SOURCE);
		expect(KEEP_SOURCE).toMatch(/[^\w-]/);
	});
});

describe('monthTone', () => {
	test('none cooked is the bare step; the busiest month is the top one', () => {
		expect(monthTone(0, 9)).toBe(0);
		expect(monthTone(9, 9)).toBe(TONE_STEPS);
		expect(monthTone(1, 1)).toBe(TONE_STEPS);
	});

	test('the steps split the busiest month evenly, any month cooked in at least the first', () => {
		const most = TONE_STEPS * 4;
		const tones = Array.from({ length: most }, (_, i) => monthTone(i + 1, most));
		for (let step = 1; step <= TONE_STEPS; step++)
			expect(tones.filter((t) => t === step)).toHaveLength(most / TONE_STEPS);
		expect(monthTone(1, 1000)).toBe(1);
	});
});

describe('summaryMonths', () => {
	test('on 12 Nov, the first days of December last year to this November, oldest first', () => {
		const months = summaryMonths(new Date('2026-11-12T23:59:00Z'));
		expect(months).toHaveLength(SUMMARY_MONTHS);
		expect(months[0]).toBe('2025-12-01');
		expect(months.at(-1)).toBe('2026-11-01');
		expect(months.slice(0, 2)).toEqual(['2025-12-01', '2026-01-01']);
	});

	test('each month once, consecutive, ending in the current one whatever the month', () => {
		for (const today of ['2027-01-01T00:00:00Z', '2026-12-31T12:00:00Z', '2028-02-29T12:00:00Z']) {
			const now = new Date(today);
			const months = summaryMonths(now);
			expect(months.at(-1)).toBe(`${today.slice(0, 7)}-01`);
			expect(new Set(months.map((m) => m.slice(0, 7))).size).toBe(SUMMARY_MONTHS);
			for (let i = 1; i < months.length; i++) {
				const prev = new Date(`${months[i - 1]}T00:00:00Z`);
				prev.setUTCMonth(prev.getUTCMonth() + 1);
				expect(prev.toISOString().slice(0, 10)).toBe(months[i]);
			}
		}
	});
});
