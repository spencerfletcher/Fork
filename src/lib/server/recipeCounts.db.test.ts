import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq, inArray, like, sql } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';

closeDbAfter();

// Committed rows (cardList reads through the pool), removed after. Each test
// narrows to this file's slugs, so other recipes never land in a page.
describe.skipIf(!localDb)("cardList's pages, against the real database", () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let cardList: typeof import('./recipeCounts.js').cardList;
	let textSearch: typeof import('./recipeSearch.js').textSearch;
	const run = stamp();
	const prefix = `pages-${run}-`;
	let ids: number[];

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		({ cardList } = await import('./recipeCounts.js'));
		({ textSearch } = await import('./recipeSearch.js'));
		const author = await db.query.profiles.findFirst();
		if (!author) throw new Error('Seed the local database first (pnpm db:seed)');
		// Seven recipes, a to g; c, d and e share one change time to the microsecond.
		const at = (s: string) => sql`${`2020-01-01 00:00:${s}`}::timestamp`;
		const times = ['06.000001', '05.5', '05.123456', '05.123456', '05.123456', '04', '03'];
		const rows = await db
			.insert(schema.recipes)
			.values(
				times.map((t, i) => ({
					authorId: author.id,
					slug: `${prefix}${'abcdefg'[i]}`,
					title: `Pagewalk ${'abcdefg'[i]}`,
					visibility: 'public' as const,
					updatedAt: at(t)
				}))
			)
			.returning({ id: schema.recipes.id });
		ids = rows.map((r) => r.id);
	});

	afterAll(async () => {
		if (db) await db.delete(schema.recipes).where(like(schema.recipes.slug, `${prefix}%`));
	});

	const mine = () => like(schema.recipes.slug, `${prefix}%`);

	/** Every page of `limit` cards, following each page's cursor, as slug letters. */
	async function walk(limit: number, where = mine(), rank = textSearch('').rank) {
		const pages: string[][] = [];
		let after: string | null = null;
		do {
			const page: Awaited<ReturnType<typeof cardList>> = await cardList(where, rank, null, {
				after,
				limit
			});
			pages.push(page.cards.map((c) => c.slug.slice(prefix.length)));
			after = page.next;
		} while (after && pages.length < 10);
		return pages;
	}

	test('pages follow on with no card twice and none missed, ties broken by id', async () => {
		// Same time: the higher id first, so e d c.
		expect(await walk(2)).toEqual([['a', 'b'], ['e', 'd'], ['c', 'f'], ['g']]);
		expect(await walk(3)).toEqual([['a', 'b', 'e'], ['d', 'c', 'f'], ['g']]);
	});

	test('a page that ends the list has no cursor, and one that fills exactly does not ask again', async () => {
		const page = await cardList(mine(), [], null, { after: null, limit: 7 });
		expect(page.cards).toHaveLength(7);
		expect(page.next).toBeNull();
	});

	test('a card carries no cursor field of its own', async () => {
		const page = await cardList(mine(), [], null, { after: null, limit: 2 });
		expect(Object.keys(page.cards[0])).not.toContain('cursorAt');
		expect(page.cards[0]).not.toHaveProperty('fts');
	});

	test('a recipe changed between pages neither repeats nor shifts the rest', async () => {
		const first = await cardList(mine(), [], null, { after: null, limit: 2 });
		// One already shown (a) and one not yet reached (f) both change now.
		await db
			.update(schema.recipes)
			.set({ updatedAt: sql`now()` })
			.where(inArray(schema.recipes.id, [ids[0], ids[5]]));
		try {
			const second = await cardList(mine(), [], null, { after: first.next, limit: 10 });
			// f moved above the cursor: the next fresh read shows it first.
			expect(second.cards.map((c) => c.slug.slice(prefix.length))).toEqual(['e', 'd', 'c', 'g']);
		} finally {
			await db
				.update(schema.recipes)
				.set({ updatedAt: sql`'2020-01-01 00:00:06.000001'::timestamp` })
				.where(eq(schema.recipes.id, ids[0]));
			await db
				.update(schema.recipes)
				.set({ updatedAt: sql`'2020-01-01 00:00:04'::timestamp` })
				.where(eq(schema.recipes.id, ids[5]));
		}
	});

	test('the cursor walks within a filter', async () => {
		const odd = inArray(schema.recipes.id, [ids[0], ids[2], ids[4], ids[6]]);
		expect(await walk(1, odd)).toEqual([['a'], ['e'], ['c'], ['g']]);
	});

	test('a ranked list (a text query) pages by position, ties as the browse order', async () => {
		expect(await walk(3, mine(), textSearch('pagewalk').rank)).toEqual([
			['a', 'b', 'e'],
			['d', 'c', 'f'],
			['g']
		]);
	});

	test('a cursor that is not one reads as the first page', async () => {
		const page = await cardList(mine(), [], null, { after: 'nonsense', limit: 2 });
		expect(page.cards.map((c) => c.slug.slice(prefix.length))).toEqual(['a', 'b']);
	});
});
