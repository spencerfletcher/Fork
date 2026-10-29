// A cook's ticks survive a reload and a new tab for 12 hours, and only that:
// localStorage, one key per recipe, version and list, so ?version=2 never
// shares v3's ticks and nothing reaches the server. Each entry carries the
// time of its last change; an older one is cleared when next read. Storage
// can throw (a private window, a full quota); then there are simply no saved
// ticks.

export type TickList = 'ingredients' | 'steps';

export const TICKS_TTL_MS = 12 * 60 * 60 * 1000;

export const ticksKey = (slug: string, version: number, list: TickList) =>
	`ticks:${slug}:v${version}:${list}`;

/** The ticked rows' indices, or null for anything that is not a list of them
 *  saved within the last 12 hours. */
export function parseTicks(raw: string | null): number[] | null {
	try {
		const value: unknown = JSON.parse(raw ?? 'null');
		if (typeof value !== 'object' || value === null) return null;
		const { ticks, at } = value as { ticks?: unknown; at?: unknown };
		if (!Array.isArray(ticks) || typeof at !== 'number') return null;
		if (Date.now() - at > TICKS_TTL_MS) return null;
		return ticks.filter((i): i is number => Number.isInteger(i) && i >= 0);
	} catch {
		return null;
	}
}

export function loadTicks(key: string): number[] {
	try {
		const raw = localStorage.getItem(key);
		const ticks = parseTicks(raw);
		if (ticks === null && raw !== null) localStorage.removeItem(key);
		return ticks ?? [];
	} catch {
		return [];
	}
}

export function saveTicks(key: string, ticks: number[]): void {
	try {
		if (ticks.length) localStorage.setItem(key, JSON.stringify({ ticks, at: Date.now() }));
		else localStorage.removeItem(key);
	} catch {
		// Not saved: the ticks still show until the page reloads.
	}
}
