import { describe, test, expect, vi, beforeEach } from 'vitest';
import { flushSync } from 'svelte';
import { pagedList } from './pagedList.svelte.js';

type Saved = { items: { id: number }[]; next: string | null; y: number };
const { snapshots } = vi.hoisted(() => ({
	snapshots: [] as { capture: () => Saved; restore: (v: Saved) => Promise<void> | void }[]
}));
vi.mock('$app/navigation', () => ({
	snapshot: (options: (typeof snapshots)[number]) => snapshots.push(options)
}));

beforeEach(() => {
	snapshots.length = 0;
});

type Data = { recipes: { id: number }[]; next: string | null };
const data = (ids: number[], next: string | null): Data => ({
	recipes: ids.map((id) => ({ id })),
	next
});

describe('pagedList', () => {
	test("starts as the load's items and cursor", () => {
		const list = pagedList(
			() => data([1, 2], 'c2'),
			(d: Data) => ({ items: d.recipes, next: d.next })
		);
		expect(list.items.map((i) => i.id)).toEqual([1, 2]);
		expect(list.next).toBe('c2');
	});

	test('appends a fetched page and its cursor, leaving out an item already shown', () => {
		const list = pagedList(
			() => data([1, 2], 'c2'),
			(d: Data) => ({ items: d.recipes, next: d.next })
		);
		expect(list.append(data([2, 3, 4], null))).toBe(2);
		expect(list.items.map((i) => i.id)).toEqual([1, 2, 3, 4]);
		expect(list.next).toBeNull();
	});

	test('a fresh load (a filter, a navigation) replaces what was appended', () => {
		let current = $state(data([1], 'c1'));
		const cleanup = $effect.root(() => {
			const list = pagedList(
				() => current,
				(d: Data) => ({ items: d.recipes, next: d.next })
			);
			list.append(data([2], 'c2'));
			expect(list.items).toHaveLength(2);
			current = data([9], null);
			flushSync();
			expect(list.items.map((i) => i.id)).toEqual([9]);
			expect(list.next).toBeNull();
		});
		cleanup();
	});

	describe('Back to a list that had grown', () => {
		const pick = (d: Data) => ({ items: d.recipes, next: d.next });

		test('captures what was shown, its cursor and where the page was scrolled', () => {
			const list = pagedList(() => data([1, 2], 'c2'), pick);
			list.append(data([3], 'c3'));
			window.scrollTo = vi.fn();
			Object.defineProperty(window, 'scrollY', { value: 640, configurable: true });
			expect(snapshots[0].capture()).toMatchObject({ next: 'c3', y: 640 });
			expect(snapshots[0].capture().items.map((i) => i.id)).toEqual([1, 2, 3]);
		});

		test('the load read the first page again: the rest comes back after it, and the scroll', async () => {
			const scrollTo = vi.fn();
			window.scrollTo = scrollTo as never;
			// Recipe 9 is new since; 1 and 2 are the fresh first page.
			const list = pagedList(() => data([9, 1], 'c1'), pick);
			await snapshots[0].restore({ items: [1, 2, 3].map((id) => ({ id })), next: 'c3', y: 640 });
			expect(list.items.map((i) => i.id)).toEqual([9, 1, 2, 3]);
			expect(list.next).toBe('c3');
			expect(scrollTo).toHaveBeenCalledWith(0, 640);
		});

		test('a load already as long (a reload of ?page=N) keeps its own fresh items', async () => {
			const scrollTo = vi.fn();
			window.scrollTo = scrollTo as never;
			const list = pagedList(() => data([1, 2, 3], null), pick);
			await snapshots[0].restore({ items: [1, 2, 3].map((id) => ({ id })), next: 'c3', y: 640 });
			expect(list.next).toBeNull();
			expect(scrollTo).not.toHaveBeenCalled();
		});
	});
});
