import { describe, test, expect } from 'vitest';
import { flushSync } from 'svelte';
import { pagedList } from './pagedList.svelte.js';

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
});
