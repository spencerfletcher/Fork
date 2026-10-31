import { describe, test, expect, beforeEach } from 'vitest';
import { flushSync } from 'svelte';
import { tickList } from './ticks.svelte.js';
import { loadTicks, ticksKey } from './ticks';

const V2 = ticksKey('cookies-ab12', 2, 'steps');
const V3 = ticksKey('cookies-ab12', 3, 'steps');

beforeEach(() => localStorage.clear());

describe('tickList', () => {
	test('a toggle is saved under the current key, and a new key reads its own ticks', () => {
		let key = $state(V3);
		const ticks = tickList(() => key);
		ticks.toggle(2, true);
		ticks.toggle(0, true);
		ticks.toggle(2, false);
		expect(ticks.ticked).toEqual([0]);
		expect(loadTicks(V3)).toEqual([0]);

		key = V2;
		flushSync();
		expect(ticks.ticked).toEqual([]);
	});

	test('clear empties the list and hands focus to its first checkbox', () => {
		document.body.innerHTML = `<section><input type="checkbox"><button>Clear ticks</button></section>`;
		const button = document.querySelector('button')!;
		const ticks = tickList(() => V3);
		ticks.toggle(1, true);
		const click = new MouseEvent('click');
		Object.defineProperty(click, 'currentTarget', { value: button });
		ticks.clear(click as MouseEvent & { currentTarget: HTMLButtonElement });
		expect(ticks.ticked).toEqual([]);
		expect(loadTicks(V3)).toEqual([]);
		expect(document.activeElement).toBe(document.querySelector('input'));
	});
});
