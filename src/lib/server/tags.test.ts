import { describe, test, expect, vi } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { syncTags, type Tx } from './tags';

// tags.ts imports the live db for listTags; the tests here only ever pass a tx in.
vi.mock('./db/index.js', () => ({ db: {} }));

function makeTx(
	existing: { id: number; name: string }[],
	created: { id: number; name: string }[] = []
) {
	const deleteChain = chain();
	const selectChain = chain(existing);
	const tagInsert = chain(created);
	const joinInsert = chain();
	const insert = vi.fn().mockReturnValueOnce(tagInsert).mockReturnValueOnce(joinInsert);
	const tx = {
		delete: vi.fn().mockReturnValue(deleteChain),
		select: vi.fn().mockReturnValue(selectChain),
		insert
	} as unknown as Tx;
	return { tx, deleteChain, selectChain, tagInsert, joinInsert, insert };
}

describe('syncTags', () => {
	test("replaces the recipe's joins", async () => {
		const m = makeTx([{ id: 1, name: 'Dessert' }]);
		await syncTags(m.tx, 7, ['Dessert']);
		expect(m.tx.delete).toHaveBeenCalledTimes(1);
		expect(m.deleteChain.where).toHaveBeenCalledTimes(1);
		expect(m.insert).toHaveBeenCalledTimes(1); // joins only, no new tags
		expect(m.tagInsert.values).toHaveBeenCalledWith([{ recipeId: 7, tagId: 1 }]);
	});

	test('reuses an existing tag whatever the case, and creates only the names that match nothing', async () => {
		const m = makeTx([{ id: 1, name: 'Dessert' }], [{ id: 9, name: 'Baking' }]);
		await syncTags(m.tx, 7, ['dessert', 'Baking']);
		expect(m.tagInsert.values).toHaveBeenCalledWith([{ name: 'Baking', slug: 'baking' }]);
		expect(m.joinInsert.values).toHaveBeenCalledWith([
			{ recipeId: 7, tagId: 1 },
			{ recipeId: 7, tagId: 9 }
		]);
	});

	test('with no names, only clears the joins', async () => {
		const m = makeTx([]);
		await syncTags(m.tx, 7, []);
		expect(m.tx.delete).toHaveBeenCalledTimes(1);
		expect(m.tx.select).not.toHaveBeenCalled();
		expect(m.insert).not.toHaveBeenCalled();
	});
});
