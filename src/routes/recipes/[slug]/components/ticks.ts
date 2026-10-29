// A cook's ticks survive a reload of the tab, and only that: sessionStorage,
// one key per recipe, version and list, so ?version=2 never shares v3's ticks
// and nothing reaches the server. Storage can throw (a private window, a full
// quota); then there are simply no saved ticks.

export type TickList = 'ingredients' | 'steps';

export const ticksKey = (slug: string, version: number, list: TickList) =>
	`ticks:${slug}:v${version}:${list}`;

/** The ticked rows' indices; anything that is not a list of them is none. */
export function parseTicks(raw: string | null): number[] {
	try {
		const value: unknown = JSON.parse(raw ?? '[]');
		if (!Array.isArray(value)) return [];
		return value.filter((i): i is number => Number.isInteger(i) && i >= 0);
	} catch {
		return [];
	}
}

export function loadTicks(key: string): number[] {
	try {
		return parseTicks(sessionStorage.getItem(key));
	} catch {
		return [];
	}
}

export function saveTicks(key: string, ticks: number[]): void {
	try {
		if (ticks.length) sessionStorage.setItem(key, JSON.stringify(ticks));
		else sessionStorage.removeItem(key);
	} catch {
		// Not saved: the ticks still show until the tab reloads.
	}
}
