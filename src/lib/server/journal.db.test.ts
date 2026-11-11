import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp, withProfiles } from '#lib/testing/db.js';

closeDbAfter();

// Times cooked and last cooked, derived from the viewer's own entries: against
// the local Supabase stack, inside a transaction that is always rolled back.
describe.skipIf(!localDb)('times and last cooked, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let journal: typeof import('./journal.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		journal = await import('./journal.js');
	});

	type Tx = import('./db/index.js').Tx;

	/** A cook, another cook, and two recipes by the cook; rolled back after. */
	async function withKitchen(
		body: (tx: Tx, me: string, other: string, ids: [number, number]) => Promise<void>
	) {
		await withProfiles(2, async (tx, [me, other], stamp) => {
			const rows = await tx
				.insert(schema.recipes)
				.values([
					{ authorId: me, slug: `c1-${stamp}`, title: 'One', visibility: 'public' },
					{ authorId: me, slug: `c2-${stamp}`, title: 'Two', visibility: 'public' }
				])
				.returning({ id: schema.recipes.id });
			await body(tx, me, other, [rows[0].id, rows[1].id]);
		});
	}

	const entry = (userId: string, recipeId: number, cookedOn: string) => ({
		userId,
		recipeId,
		dish: 'Dish',
		cookedOn
	});

	test('counts the cook’s own entries per recipe, with the latest day; others’ and deleted ones never', async () => {
		await withKitchen(async (tx, me, other, [one, two]) => {
			await tx
				.insert(schema.logEntries)
				.values([
					entry(me, one, '2026-11-01'),
					entry(me, one, '2026-11-03'),
					entry(me, one, '2026-10-20'),
					entry(other, one, '2026-11-09'),
					entry(other, two, '2026-11-09')
				]);
			const [gone] = await tx
				.insert(schema.logEntries)
				.values(entry(me, one, '2026-11-10'))
				.returning({ id: schema.logEntries.id });
			await tx.delete(schema.logEntries).where(eq(schema.logEntries.id, gone.id));

			const counts = await journal.cookedCounts(me, [one, two], tx);
			expect(counts.get(one)).toEqual({ timesCooked: 3, lastCookedOn: '2026-11-03' });
			// Cooked only by someone else: nothing for me.
			expect(counts.has(two)).toBe(false);
		});
	});

	test('one entry is once, on its day; no ids is no query result', async () => {
		await withKitchen(async (tx, me, _other, [one]) => {
			await tx.insert(schema.logEntries).values(entry(me, one, '2026-11-08'));
			expect((await journal.cookedCounts(me, [one], tx)).get(one)).toEqual({
				timesCooked: 1,
				lastCookedOn: '2026-11-08'
			});
			expect((await journal.cookedCounts(me, [], tx)).size).toBe(0);
		});
	});

	test('the recipe page’s latest entry carries the count of all the cook’s entries', async () => {
		await withKitchen(async (tx, me, other, [one]) => {
			const [, latest] = await tx
				.insert(schema.logEntries)
				.values([
					entry(me, one, '2026-11-01'),
					entry(me, one, '2026-11-03'),
					entry(other, one, '2026-11-09')
				])
				.returning({ id: schema.logEntries.id });
			expect(await journal.lastEntryFor(me, one, tx)).toEqual({
				id: latest.id,
				cookedOn: '2026-11-03',
				timesCooked: 2
			});
			expect(await journal.lastEntryFor(other, one, tx)).toMatchObject({ timesCooked: 1 });
			expect(await journal.lastEntryFor(`nobody-${me}`, one, tx)).toBeNull();
		});
	});
});

// The saver's kept copy of a withdrawn recipe in the Journal form: committed
// rows (resolveRecipe reads through the pool) between two seed profiles, as
// other files' tests read the first profile; the recipe goes after, its
// versions and save with it.
describe.skipIf(!localDb)('kept copies in the Journal, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let journal: typeof import('./journal.js');
	let author: string;
	let saver: string;
	const slug = `journal-kept-${stamp()}`;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		journal = await import('./journal.js');
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		const profiles = await db.query.profiles.findMany({ limit: 2 });
		if (profiles.length < 2) throw new Error('Seed the local database first (pnpm db:seed)');
		[author, saver] = profiles.map((p) => p.id);
		const [{ id }] = await db
			.insert(schema.recipes)
			.values({ authorId: author, slug, title: 'Renamed in private', visibility: 'private' })
			.returning({ id: schema.recipes.id });
		await db.insert(schema.recipeVersions).values(
			[1, 2].map((n) => ({
				recipeId: id,
				versionNumber: n,
				commitMessage: 'v',
				...makeContent({ title: `Soup v${n}` }),
				createdBy: author
			}))
		);
		await db.insert(schema.favorites).values({ userId: saver, recipeId: id, copyVersion: 1 });
	});

	afterAll(async () => {
		if (db) await db.delete(schema.recipes).where(eq(schema.recipes.slug, slug));
	});

	test('resolveRecipe gives the saver their kept version only, by its own title', async () => {
		const me = { id: saver };
		expect(await journal.resolveRecipe(me, slug, null)).toMatchObject({
			slug,
			title: 'Soup v1',
			versionNumber: 1,
			visibility: 'private'
		});
		expect(await journal.resolveRecipe(me, slug, 1)).toMatchObject({ versionNumber: 1 });
		expect(await journal.resolveRecipe(me, slug, 2)).toBeNull();
		expect(await journal.resolveRecipe({ id: `${author}-nobody` }, slug, null)).toBeNull();
	});

	test("recipeChoices offers the copy by its kept version's title and number, never the row's", async () => {
		const choices = await journal.recipeChoices({ id: saver });
		expect(JSON.stringify(choices)).not.toContain('Renamed in private');
		expect(JSON.stringify(await journal.resolveRecipe({ id: saver }, slug, null))).not.toContain(
			'Renamed in private'
		);
		expect(choices.find((c) => c.slug === slug)).toEqual({
			slug,
			title: 'Soup v1',
			visibility: 'private',
			latestVersion: 1
		});
	});
});

// Committed rows (journalOf reads through the pool) for a fresh cook, removed
// after with the profile.
describe.skipIf(!localDb)("the Journal's pages, against the real database", () => {
	let db: typeof import('./db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let journal: typeof import('./journal.js');
	const cook = `test-journal-${stamp()}`;
	// Two on one day, so the tie is broken by the later logged.
	const DAYS = ['2026-03-02', '2026-03-02', '2026-02-10', '2026-01-05', '2025-12-24'];
	let ids: number[];

	beforeAll(async () => {
		({ db } = await import('./db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		journal = await import('./journal.js');
		await db.insert(schema.profiles).values({ id: cook, username: cook });
		const rows = await db
			.insert(schema.logEntries)
			.values(DAYS.map((cookedOn, i) => ({ userId: cook, dish: `Dish ${i}`, cookedOn })))
			.returning({ id: schema.logEntries.id });
		ids = rows.map((r) => r.id);
	});

	afterAll(async () => {
		if (db) await db.delete(schema.profiles).where(eq(schema.profiles.id, cook));
	});

	test('pages follow on, newest cooked first, the later logged first on one day, none twice', async () => {
		const seen: number[][] = [];
		let after: string | null = null;
		do {
			const page: Awaited<ReturnType<typeof journal.journalOf>> = await journal.journalOf(
				{ id: cook },
				{ after, limit: 2 }
			);
			seen.push(page.entries.map((e) => e.id));
			after = page.next;
		} while (after && seen.length < 10);
		expect(seen).toEqual([[ids[1], ids[0]], [ids[2], ids[3]], [ids[4]]]);
	});

	test('the summary counts every entry and names the oldest day, whatever the page', async () => {
		expect(await journal.journalSummary(cook)).toEqual({ total: 5, oldest: '2025-12-24' });
	});
});
