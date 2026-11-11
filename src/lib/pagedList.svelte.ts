/**
 * A list Show more appends to: the load's items and cursor, plus every page
 * appended since, until the load runs again (a filter, a navigation), which
 * starts it over. `pick` reads the items and cursor out of a page's data, the
 * load's and each fetched page's alike.
 */
export function pagedList<D, T extends { id: number }>(
	current: () => D,
	pick: (data: D) => { items: T[]; next: string | null }
) {
	let items = $derived(pick(current()).items);
	let next = $derived(pick(current()).next);
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
