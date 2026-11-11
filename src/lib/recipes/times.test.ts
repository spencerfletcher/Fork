import { describe, test, expect } from 'vitest';
import {
	formatDuration,
	MAX_DURATION_MINUTES,
	OVERNIGHT_MINUTES,
	readDuration,
	timeSpans
} from './times.js';

describe('readDuration', () => {
	test.each([
		['', null],
		['   ', null],
		['45', 45],
		['45 min', 45],
		['45 mins', 45],
		['45 minutes', 45],
		['45m', 45],
		['1 h 30', 90],
		['1h30', 90],
		['1 h 30 min', 90],
		['1 hour 30 minutes', 90],
		['1 hour and 30 minutes', 90],
		['1 hr, 15 mins', 75],
		['1:30', 90],
		['1.5 hours', 90],
		['1,5 h', 90],
		['2 h', 120],
		['an hour', 60],
		['half an hour', 30],
		['2 days', 2880],
		['1 day', 1440],
		['1 d 2 h', 1560],
		['Overnight', OVERNIGHT_MINUTES],
		['0', 0]
	])('%j reads as %j minutes', (text, minutes) => {
		expect(readDuration(text)).toEqual({ ok: true, minutes });
	});

	test.each(['soon', '20-30 min', '-5', 'min', '1 h 1 h', '30 min 1 h', 'h 30', '1.2.3 h'])(
		'%j is not a time',
		(text) => {
			expect(readDuration(text)).toEqual({ ok: false, reason: 'unreadable' });
		}
	);

	test('past the cap is too long', () => {
		expect(readDuration(`${MAX_DURATION_MINUTES + 1}`)).toEqual({ ok: false, reason: 'tooLong' });
		expect(readDuration(`${MAX_DURATION_MINUTES}`)).toEqual({
			ok: true,
			minutes: MAX_DURATION_MINUTES
		});
	});
});

describe('formatDuration', () => {
	test.each([
		[0, '0 min'],
		[45, '45 min'],
		[60, '1 h'],
		[90, '1 h 30 min'],
		[1500, '25 h'],
		[1440, '1 day'],
		[2880, '2 days'],
		[OVERNIGHT_MINUTES, `${OVERNIGHT_MINUTES / 60} h`]
	])('%j minutes reads %j', (minutes, text) => {
		expect(formatDuration(minutes)).toBe(text);
	});

	test('what it writes reads back as the same minutes', () => {
		for (const minutes of [0, 5, 59, 60, 61, 90, 125, 1439, 1440, 1441, 2880, 4321])
			expect(readDuration(formatDuration(minutes))).toEqual({ ok: true, minutes });
	});
});

describe('timeSpans', () => {
	test('each stated time is its own span, in field order, never summed', () => {
		expect(timeSpans({ restTimeMinutes: 480, cookTimeMinutes: 13, prepTimeMinutes: 15 })).toEqual([
			{ value: '15 min', word: 'prep' },
			{ value: '13 min', word: 'cook' },
			{ value: '8 h', word: 'rest' }
		]);
	});

	test('a missing or zero time says nothing', () => {
		expect(timeSpans({ prepTimeMinutes: 0, cookTimeMinutes: null })).toEqual([]);
	});
});
