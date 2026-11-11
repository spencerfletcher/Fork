import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { chain } from '#lib/testing/drizzle.js';
import { recipes } from './db/schema.js';
import { TRASH_DAYS } from '#lib/trash.js';

const { selectMock, selectDistinctMock, transactionMock, removeMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	selectDistinctMock: vi.fn(),
	transactionMock: vi.fn(),
	removeMock: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: { select: selectMock, selectDistinct: selectDistinctMock, transaction: transactionMock }
}));
vi.mock('#lib/server/images.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/images.js')>()),
	removeRecipeImage: removeMock
}));

import {
	deleteForever,
	inTrashOf,
	PURGE_EVERY_MS,
	purgeExpiredTrash,
	trashAge,
	trashCutoff,
	trashedRecipe
} from './trash.js';

const DAY = 86_400_000;
const NOW = new Date('2026-11-11T12:00:00Z');
const SUPABASE = { storage: {} } as never;
const photo = (name: string) =>
	`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/owner/${name}.png`;

beforeEach(() => vi.clearAllMocks());

/**
 * A transaction whose locked row is `locked` and whose versions show
 * `imageUrls`; `kept` is what other recipes' versions still show afterwards.
 */
function setUpDelete(
	locked: { deletedAt: Date | null } | undefined,
	imageUrls: (string | null)[],
	kept: string[] = []
) {
	// Awaited without .for, the same chain is the kept-copies read: none.
	const lock = chain([]);
	lock.for = vi.fn().mockResolvedValue(locked ? [locked] : []);
	const tx = {
		select: vi.fn().mockReturnValue(lock),
		delete: vi.fn().mockReturnValue(chain()),
		query: {
			recipeVersions: {
				findMany: vi.fn().mockResolvedValue(imageUrls.map((imageUrl) => ({ imageUrl })))
			}
		}
	};
	transactionMock.mockImplementation(async (fn: (t: unknown) => unknown) => fn(tx));
	selectDistinctMock.mockReturnValue(chain(kept.map((imageUrl) => ({ imageUrl }))));
	return tx;
}

describe('the 30 days', () => {
	test('the cutoff is TRASH_DAYS before now', () => {
		expect(trashCutoff(NOW).getTime()).toBe(NOW.getTime() - TRASH_DAYS * DAY);
	});

	test("the owner's Trash holds their recipes deleted after the cutoff only", () => {
		expect(inTrashOf('owner', NOW)).toEqual(
			and(
				eq(recipes.authorId, 'owner'),
				gt(recipes.deletedAt, trashCutoff(NOW)),
				isNull(recipes.erasedAt)
			)
		);
	});

	test('a row says how long ago it was deleted and how many days are left', () => {
		const ago = (days: number) => trashAge(new Date(NOW.getTime() - days * DAY), NOW);
		expect(ago(0)).toEqual({ deleted: 'Deleted today', left: `${TRASH_DAYS} days left` });
		expect(ago(1)).toEqual({ deleted: 'Deleted 1 day ago', left: `${TRASH_DAYS - 1} days left` });
		expect(ago(3.5)).toEqual({
			deleted: 'Deleted 3 days ago',
			left: `${TRASH_DAYS - 3} days left`
		});
		expect(ago(TRASH_DAYS - 0.5)).toEqual({
			deleted: `Deleted ${TRASH_DAYS - 1} days ago`,
			left: '1 day left'
		});
	});
});

describe('trashedRecipe', () => {
	test("the owner's restorable recipe at the slug, else null", async () => {
		const found = chain([{ id: 7, slug: 'soup', title: 'Soup' }]);
		selectMock.mockReturnValue(found);
		expect(await trashedRecipe('soup', 'owner', NOW)).toEqual({
			id: 7,
			slug: 'soup',
			title: 'Soup'
		});
		expect(found.where).toHaveBeenCalledWith(
			and(eq(recipes.slug, 'soup'), inTrashOf('owner', NOW))
		);

		// Someone else's, a live one, and one past the 30 days all read as none.
		selectMock.mockReturnValue(chain([]));
		expect(await trashedRecipe('soup', 'other', NOW)).toBeNull();
	});
});

describe('deleteForever', () => {
	test('removes the row and each distinct photo once, under the save action’s row lock', async () => {
		const tx = setUpDelete({ deletedAt: NOW }, [photo('a'), photo('a'), null, photo('b')]);
		await deleteForever(1, SUPABASE);
		expect(tx.select().for).toHaveBeenCalledWith('update');
		expect(tx.delete).toHaveBeenCalledWith(recipes);
		expect(removeMock).toHaveBeenCalledTimes(1);
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner/a.png', 'owner/b.png');
	});

	test("keeps a photo another recipe still shows, as a fork shows its parent's", async () => {
		setUpDelete({ deletedAt: NOW }, [photo('a'), photo('b')], [photo('a')]);
		await deleteForever(1, SUPABASE);
		expect(removeMock).toHaveBeenCalledWith(SUPABASE, 'owner/b.png');
	});

	test('removes nothing from storage when no photo is in the bucket', async () => {
		setUpDelete({ deletedAt: NOW }, [null, 'https://images.example.com/cake.jpg']);
		await deleteForever(1, SUPABASE);
		expect(removeMock).not.toHaveBeenCalled();
	});

	test('leaves a recipe restored meanwhile, or already gone, untouched', async () => {
		for (const locked of [{ deletedAt: null }, undefined]) {
			const tx = setUpDelete(locked, [photo('a')]);
			await deleteForever(1, SUPABASE);
			expect(tx.delete).not.toHaveBeenCalled();
			expect(removeMock).not.toHaveBeenCalled();
		}
	});
});

describe('purgeExpiredTrash', () => {
	// The throttle is module state, so each test starts a purge interval past the last.
	let clock = NOW.getTime();
	const later = () => new Date((clock += PURGE_EVERY_MS * 10));

	test('deletes for good every recipe, any owner, deleted on or before the cutoff', async () => {
		const expired = chain([{ id: 3 }, { id: 4 }]);
		selectMock.mockReturnValue(expired);
		setUpDelete({ deletedAt: NOW }, []);
		const now = later();
		await purgeExpiredTrash(SUPABASE, now);
		expect(expired.where).toHaveBeenCalledWith(
			and(lte(recipes.deletedAt, trashCutoff(now)), isNull(recipes.erasedAt))
		);
		expect(transactionMock).toHaveBeenCalledTimes(2);
	});

	test('runs at most once per interval on one server', async () => {
		selectMock.mockReturnValue(chain([]));
		const now = later();
		await purgeExpiredTrash(SUPABASE, now);
		await purgeExpiredTrash(SUPABASE, new Date(now.getTime() + PURGE_EVERY_MS - 1));
		expect(selectMock).toHaveBeenCalledTimes(1);
		await purgeExpiredTrash(SUPABASE, new Date(now.getTime() + PURGE_EVERY_MS));
		expect(selectMock).toHaveBeenCalledTimes(2);
	});

	test('a failure is logged, never thrown at the page that ran it', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		selectMock.mockImplementation(() => {
			throw new Error('down');
		});
		await expect(purgeExpiredTrash(SUPABASE, later())).resolves.toBeUndefined();
		expect(error).toHaveBeenCalled();
		error.mockRestore();
	});
});
