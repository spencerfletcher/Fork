import { loadTicks, saveTicks } from './ticks';

/**
 * One list's ticks, read through a getter so they reload whenever the page
 * moves to another version (a new key), and a click changes them. The server
 * has no localStorage, so it renders none; hydration restores them.
 */
export function tickList(key: () => string) {
	let ticked = $derived(loadTicks(key()));

	return {
		get ticked() {
			return ticked;
		},
		toggle(i: number, on: boolean) {
			ticked = on ? [...ticked, i] : ticked.filter((j) => j !== i);
			saveTicks(key(), ticked);
		},
		// The button leaves with the last tick, so focus moves to the list's first
		// checkbox rather than dropping to the page. A mouse click (detail > 0)
		// keeps the page still; Enter or Space (detail 0) scrolls to where focus went.
		clear(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
			e.currentTarget
				.closest('section')
				?.querySelector<HTMLInputElement>('input[type="checkbox"]')
				?.focus({ preventScroll: e.detail > 0 });
			ticked = [];
			saveTicks(key(), ticked);
		}
	};
}
