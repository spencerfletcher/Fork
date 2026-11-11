import { SvelteSet } from 'svelte/reactivity';

/** What the bar last said: an act's outcome, or that the choice was cleared; `trash` adds the Trash link. */
export type SelectStatus = { text: string; trash?: boolean };

/**
 * Select mode's state, the page's alone (never the URL or storage): whether
 * it is on, the chosen recipe ids and the bar's last word. `listKey` names
 * the list shown (its filters, collection, search, sort and view, not its
 * place): a new one clears the choice, and the status says so; Show more
 * keeps it. Call during component init.
 */
export function selection(listKey: () => string) {
	let on = $state(false);
	let status = $state<SelectStatus | null>(null);
	const ids = new SvelteSet<number>();

	let shown = listKey();
	$effect(() => {
		const key = listKey();
		if (key === shown) return;
		shown = key;
		if (ids.size === 0) return;
		ids.clear();
		status = { text: 'Selection cleared: the list changed.' };
	});

	return {
		get on() {
			return on;
		},
		get status() {
			return status;
		},
		set status(next: SelectStatus | null) {
			status = next;
		},
		has: (id: number) => ids.has(id),
		set(id: number, checked: boolean) {
			if (checked) ids.add(id);
			else ids.delete(id);
		},
		add(list: number[]) {
			for (const id of list) ids.add(id);
		},
		clear() {
			ids.clear();
		},
		start() {
			on = true;
		},
		stop() {
			on = false;
			status = null;
			ids.clear();
		}
	};
}

export type Selection = ReturnType<typeof selection>;
