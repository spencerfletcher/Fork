import { snapshot } from '$app/navigation';
import { tick } from 'svelte';

/**
 * A list Show more appends to: the load's items and cursor, plus every page
 * appended since, until the load runs again (a filter, a navigation), which
 * starts it over. `pick` reads the items and cursor out of a page's data, the
 * load's and each fetched page's alike. Call it during component init.
 *
 * Back to the list: Show more writes `?page=N` by a shallow replace, and
 * SvelteKit loads a shallow entry's underlying URL, the first page alone, and
 * scrolls before anything restores. So what was shown, its cursor and the
 * scroll are kept per history entry (SvelteKit's snapshot), and put back
 * after the fresh first page when the load came back shorter. A reload loads
 * `?page=N` whole and keeps its own fresh items.
 */
export function pagedList<D, T extends { id: number | string }>(
	current: () => D,
	pick: (data: D) => { items: T[]; next: string | null }
) {
	let items = $derived(pick(current()).items);
	let next = $derived(pick(current()).next);

	snapshot({
		id: 'paged-list',
		capture: () => ({ items, next, y: window.scrollY }),
		restore: async (saved: { items: T[]; next: string | null; y: number }) => {
			if (saved.items.length <= items.length) return;
			// A throwaway lookup, not state: nothing reads it reactively.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const fresh = new Set(items.map((i) => i.id));
			items = [...items, ...saved.items.filter((i) => !fresh.has(i.id))];
			next = saved.next;
			await tick();
			window.scrollTo(0, saved.y);
		}
	});

	return {
		get items() {
			return items;
		},
		get next() {
			return next;
		},
		/** Appends a fetched page's items, leaving out any already shown; returns how many were new. */
		append(data: D): number {
			const page = pick(data);
			// A throwaway lookup, not state: nothing reads it reactively.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const shown = new Set(items.map((i) => i.id));
			const fresh = page.items.filter((i) => !shown.has(i.id));
			items = [...items, ...fresh];
			next = page.next;
			return fresh.length;
		}
	};
}

export type PagedList = Pick<ReturnType<typeof pagedList>, 'next' | 'append'>;
