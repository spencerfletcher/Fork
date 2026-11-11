import { describe, test, expect } from 'vitest';
import { flushSync } from 'svelte';
import { selection } from './selection.svelte.js';

/** A selection over a list key the test changes, inside an effect root. */
function track() {
	let key = $state('filter=mine');
	let sel!: ReturnType<typeof selection>;
	const stop = $effect.root(() => {
		sel = selection(() => key);
	});
	flushSync();
	return {
		sel,
		show: (next: string) => {
			key = next;
			flushSync();
		},
		stop
	};
}

describe('select mode’s selection', () => {
	test('a new list clears the choice and says so; the mode stays on', () => {
		const { sel, show, stop } = track();
		sel.start();
		sel.add([3, 5]);
		show('filter=saved');
		expect(sel.has(3) || sel.has(5)).toBe(false);
		expect(sel.status?.text).toBe('Selection cleared: the list changed.');
		expect(sel.on).toBe(true);
		stop();
	});

	test('the same list again (Show more, a reload in place) keeps it', () => {
		const { sel, show, stop } = track();
		sel.start();
		sel.set(3, true);
		show('filter=mine');
		expect(sel.has(3)).toBe(true);
		expect(sel.status).toBeNull();
		stop();
	});

	test('nothing chosen, a new list says nothing', () => {
		const { sel, show, stop } = track();
		sel.start();
		show('sort=title');
		expect(sel.status).toBeNull();
		stop();
	});

	test('leaving the mode drops the choice and the status', () => {
		const { sel, stop } = track();
		sel.start();
		sel.set(3, true);
		sel.status = { text: 'Done.' };
		sel.stop();
		expect([sel.on, sel.has(3), sel.status]).toEqual([false, false, null]);
		stop();
	});
});
