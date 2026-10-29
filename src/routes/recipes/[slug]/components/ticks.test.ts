import { describe, test, expect, vi, afterEach } from 'vitest';
import { ticksKey, parseTicks, loadTicks, saveTicks } from './ticks';

/** A Map behind the two Storage calls the module makes. */
function stubStorage() {
	const store = new Map<string, string>();
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k)
	});
	return store;
}

afterEach(() => vi.unstubAllGlobals());

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

	test('reads back only a list of row indices; anything else is no ticks', () => {
		expect(parseTicks(JSON.stringify([0, 4]))).toEqual([0, 4]);
		expect(parseTicks(null)).toEqual([]);
		expect(parseTicks('not json')).toEqual([]);
		expect(parseTicks('{"0":true}')).toEqual([]);
		expect(parseTicks('[1, "2", -1, 1.5, 3]')).toEqual([1, 3]);
	});

	test('a saved list loads back under its key and no other', () => {
		const store = stubStorage();
		const key = ticksKey('cookies-ab12', 3, 'ingredients');
		saveTicks(key, [2, 0]);
		expect(loadTicks(key)).toEqual([2, 0]);
		expect(loadTicks(ticksKey('cookies-ab12', 2, 'ingredients'))).toEqual([]);
		// Clearing the last tick leaves nothing behind.
		saveTicks(key, []);
		expect(store.size).toBe(0);
	});

	test('storage that throws (a private window) means no ticks, not an error', () => {
		vi.stubGlobal('sessionStorage', {
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
