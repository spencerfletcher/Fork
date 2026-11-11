import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq, inArray, like, or, sql } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp, withProfiles } from '#lib/testing/db.js';
import type { Tx } from '#lib/server/db/index.js';
import { CARD_SORTS, type CardSort } from '#lib/listPage.js';
import { makeContent } from '#lib/recipes/fixtures.js';

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

// Rolled back: cardList reads through the transaction it is handed.
describe.skipIf(!localDb)(
	"cardList on the viewer's own shelf, in a rolled-back transaction",
	() => {
		type Schema = typeof import('#lib/server/db/schema.js');
		let schema: Schema;
		let cardList: typeof import('./recipeCounts.js').cardList;

		beforeAll(async () => {
			schema = await import('#lib/server/db/schema.js');
			({ cardList } = await import('./recipeCounts.js'));
		});

		/** `titles` as the cook's own public recipes, in order, ids ascending; returns their ids. */
		async function shelf(tx: Tx, authorId: string, s: string, titles: string[]) {
			const rows = await tx
				.insert(schema.recipes)
				.values(
					titles.map((title, i) => ({
						authorId,
						slug: `shelf-${s}-${i}`,
						title,
						visibility: 'public' as const,
						// One change time for all, so only the id breaks a tie.
						updatedAt: sql`'2020-01-01'::timestamp`
					}))
				)
				.returning({ id: schema.recipes.id });
			return rows.map((r) => r.id);
		}

		const theirs = (authorId: string) => eq(schema.recipes.authorId, authorId);

		test('each card carries its first three tags by name, the Cookbook only', async () => {
			await withProfiles(1, async (tx, [cook], s) => {
				const [tagged, bare] = await shelf(tx, cook, s, ['Tagged', 'Bare']);
				const made = await tx
					.insert(schema.tags)
					.values(
						['soup', 'dinner', 'quick', 'autumn'].map((n) => ({
							name: `${n}-${s}`,
							slug: `${n}-${s}`
						}))
					)
					.returning({ id: schema.tags.id });
				await tx
					.insert(schema.recipesToTags)
					.values(made.map((t) => ({ recipeId: tagged, tagId: t.id })));

				const viewer = { id: cook };
				const page = await cardList(theirs(cook), [], viewer, {
					after: null,
					limit: 5,
					cooked: true,
					conn: tx
				});
				const byId = new Map(page.cards.map((c) => [c.id, c]));
				expect(byId.get(tagged)?.tags).toEqual([`autumn-${s}`, `dinner-${s}`, `quick-${s}`]);
				expect(byId.get(bare)?.tags).toEqual([]);

				const browse = await cardList(theirs(cook), [], viewer, {
					after: null,
					limit: 5,
					conn: tx
				});
				expect(browse.cards[0]).not.toHaveProperty('tags');
			});
		});

		/** `days` as `userId`'s Journal entries of `recipeId`. */
		async function cooked(tx: Tx, userId: string, recipeId: number, days: string[]) {
			await tx
				.insert(schema.logEntries)
				.values(days.map((cookedOn) => ({ userId, recipeId, dish: 'Dish', cookedOn })));
		}

		/**
		 * A cook's shelf of nine, six never cooked by them (one of which a stranger
		 * cooked often, which must not count): titles, then its id by title.
		 */
		async function cookedShelf(tx: Tx, cook: string, stranger: string, s: string) {
			const titles = [
				'banana',
				'Apple',
				'cherry',
				'date',
				'Elder',
				'fig',
				'grape',
				'Hazel',
				'iris'
			];
			const ids = await shelf(tx, cook, s, titles);
			const id = Object.fromEntries(titles.map((t, i) => [t, ids[i]]));
			await cooked(tx, cook, id.banana, ['2026-01-05']);
			await cooked(tx, cook, id.Apple, ['2026-03-01', '2026-03-02', '2026-03-03']);
			await cooked(tx, cook, id.cherry, ['2025-12-01', '2026-02-10']);
			await cooked(tx, stranger, id.date, ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04']);
			return { titles, id };
		}

		/** Every page of `limit` under `sort`, as titles, following each page's cursor. */
		async function walkSorted(tx: Tx, cook: string, sort: CardSort, limit: number) {
			const seen: string[] = [];
			let after: string | null = null;
			let pages = 0;
			do {
				const page: Awaited<ReturnType<typeof cardList>> = await cardList(
					theirs(cook),
					[],
					{ id: cook },
					{ after, limit, cooked: true, sort, conn: tx }
				);
				seen.push(...page.cards.map((c) => c.title));
				after = page.next;
			} while (after && ++pages < 20);
			return seen;
		}

		// The tie-break under every sort: the newest change, then the higher id.
		// Here the change times are one, so the newer recipe (higher id) first.
		const byNewest = (titles: string[], all: string[]) =>
			[...titles].sort((a, b) => all.indexOf(b) - all.indexOf(a));

		test('each sort orders by the viewer’s own Journal, ties as the newest change', async () => {
			await withProfiles(2, async (tx, [cook, stranger], s) => {
				const { titles } = await cookedShelf(tx, cook, stranger, s);
				const never = byNewest(
					titles.filter((t) => !['banana', 'Apple', 'cherry'].includes(t)),
					titles
				);
				const walk = (sort: CardSort) => walkSorted(tx, cook, sort, 20);

				expect(await walk('newest')).toEqual(byNewest(titles, titles));
				// Last cooked, newest first; never cooked last.
				expect(await walk('cooked')).toEqual(['Apple', 'cherry', 'banana', ...never]);
				// Times cooked; the stranger's four entries count for nothing.
				expect(await walk('most')).toEqual(['Apple', 'cherry', 'banana', ...never]);
				// Never cooked first, then the longest ago.
				expect(await walk('stale')).toEqual([...never, 'banana', 'cherry', 'Apple']);
				// Whatever its case.
				expect(await walk('title')).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
			});
		});

		test('Most cooked breaks a tie in count by the latest day', async () => {
			await withProfiles(1, async (tx, [cook], s) => {
				// Older has the higher id, so the plain tie-break would put it first.
				const [newer, older] = await shelf(tx, cook, s, ['Newer', 'Older']);
				await cooked(tx, cook, older, ['2026-01-01', '2026-01-02']);
				await cooked(tx, cook, newer, ['2025-01-01', '2026-02-01']);
				expect(await walkSorted(tx, cook, 'most', 5)).toEqual(['Newer', 'Older']);
			});
		});

		test('every sort pages through its ties with no recipe twice and none missed', async () => {
			await withProfiles(2, async (tx, [cook, stranger], s) => {
				const { titles } = await cookedShelf(tx, cook, stranger, s);
				for (const sort of CARD_SORTS) {
					const whole = await walkSorted(tx, cook, sort, 20);
					expect(new Set(whole).size).toBe(titles.length);
					for (const limit of [1, 2, 4]) {
						expect(await walkSorted(tx, cook, sort, limit), `${sort} by ${limit}`).toEqual(whole);
					}
				}
			});
		});

		test('A to Z files a kept copy under the title it keeps, not the withdrawn row’s', async () => {
			await withProfiles(2, async (tx, [cook, author], s) => {
				const [mine] = await shelf(tx, cook, s, ['Middle']);
				const [row] = await tx
					.insert(schema.recipes)
					.values({ authorId: author, slug: `kept-${s}`, title: 'Aardvark', visibility: 'private' })
					.returning({ id: schema.recipes.id });
				await tx.insert(schema.recipeVersions).values({
					recipeId: row.id,
					versionNumber: 1,
					commitMessage: 'v',
					...makeContent({ title: 'Zucchini bread' }),
					createdBy: author
				});
				await tx
					.insert(schema.favorites)
					.values({ userId: cook, recipeId: row.id, copyVersion: 1 });
				const where = or(eq(schema.recipes.id, mine), eq(schema.recipes.id, row.id));
				const page = await cardList(
					where,
					[],
					{ id: cook },
					{ after: null, limit: 5, cooked: true, sort: 'title', conn: tx }
				);
				expect(page.cards.map((c) => c.id)).toEqual([mine, row.id]);
			});
		});
	}
);
