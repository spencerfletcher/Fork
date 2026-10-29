import { describe, test, expect, vi, afterEach } from 'vitest';
import { ticksKey, parseTicks, loadTicks, saveTicks, TICKS_TTL_MS } from './ticks';

/** A Map behind the three Storage calls the module makes. */
function stubStorage() {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k)
	});
	return store;
}

const T0 = new Date('2026-10-29T18:00:00Z').getTime();
const KEY = ticksKey('cookies-ab12', 3, 'ingredients');

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('ticks', () => {
	test('each recipe, version and list has a key of its own', () => {
		const keys = [
			ticksKey('cookies-ab12', 3, 'ingredients'),
			ticksKey('cookies-ab12', 3, 'steps'),
			ticksKey('cookies-ab12', 2, 'ingredients'),
			ticksKey('dal-cd34', 3, 'ingredients')
		];
		expect(new Set(keys).size).toBe(keys.length);
	});

	test('reads back only a list of row indices saved with a time; anything else is no ticks', () => {
		vi.useFakeTimers({ now: T0 });
		const saved = (ticks: unknown) => JSON.stringify({ ticks, at: T0 });
		expect(parseTicks(saved([0, 4]))).toEqual([0, 4]);
		expect(parseTicks(saved([1, '2', -1, 1.5, 3]))).toEqual([1, 3]);
		expect(parseTicks(null)).toBeNull();
		expect(parseTicks('not json')).toBeNull();
		expect(parseTicks('[0, 4]')).toBeNull();
		expect(parseTicks('{"ticks":[0]}')).toBeNull();
		expect(parseTicks(saved({ 0: true }))).toBeNull();
	});

	test('a saved list loads back under its key and no other, in localStorage', () => {
		vi.useFakeTimers({ now: T0 });
		const store = stubStorage();
		saveTicks(KEY, [2, 0]);
		expect(JSON.parse(store.get(KEY)!)).toEqual({ ticks: [2, 0], at: T0 });
		expect(loadTicks(KEY)).toEqual([2, 0]);
		expect(loadTicks(ticksKey('cookies-ab12', 2, 'ingredients'))).toEqual([]);
		// Clearing the last tick leaves nothing behind.
		saveTicks(KEY, []);
		expect(store.size).toBe(0);
	});

	test('fresh: ticks saved up to 12 hours ago still load', () => {
		vi.useFakeTimers({ now: T0 });
		stubStorage();
		saveTicks(KEY, [1]);
		vi.setSystemTime(T0 + TICKS_TTL_MS);
		expect(loadTicks(KEY)).toEqual([1]);
	});

	test('stale: ticks older than 12 hours are none, and the entry is cleared', () => {
		vi.useFakeTimers({ now: T0 });
		const store = stubStorage();
		saveTicks(KEY, [1]);
		vi.setSystemTime(T0 + TICKS_TTL_MS + 1);
		expect(loadTicks(KEY)).toEqual([]);
		expect(store.has(KEY)).toBe(false);
	});

	test('malformed: an entry that is not ticks with a time is none, and is cleared', () => {
		const store = stubStorage();
		store.set(KEY, '[0, 4]');
		expect(loadTicks(KEY)).toEqual([]);
		expect(store.has(KEY)).toBe(false);
	});

	test('storage that throws (a private window) means no ticks, not an error', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('SecurityError');
			},
			setItem: () => {
				throw new Error('QuotaExceededError');
			},
			removeItem: () => {
				throw new Error('SecurityError');
			}
		});
		const key = ticksKey('cookies-ab12', 3, 'steps');
		expect(() => saveTicks(key, [1])).not.toThrow();
		expect(loadTicks(key)).toEqual([]);
	});
});
