import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { inArray } from 'drizzle-orm';
import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';

closeDbAfter();

// The lead is not repeated in the grid (owner, 12 November 2026: "drop
// discover from the grid but make sure the count is accurate"): across every
// page, by cursor, by ?page=N and ranked by a search, each recipe in the set
// shows once, lead included, and the count is the whole set. Committed rows
// (the loader reads through the pool), each cook's set narrowed by @handle so
// it is exact, removed after.
describe.skipIf(!localDb)('Discover paging with its lead, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let loadDiscover: typeof import('./discover.server.js').loadDiscover;
	const run = stamp();
	// One search word only these recipes carry, letters alone so it stems as itself.
	const word = `zq${run.replace(/[^a-z]/g, '')}walk`;
	const ids = { cook: `test-dlead-${run}`, solo: `test-dsolo-${run}`, fan: `test-dfan-${run}` };
	const handle = { cook: `dlead-${run}`, solo: `dsolo-${run}` };
	let cookIds: number[] = [];
	let soloId: number;
	let savedId: number;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		({ loadDiscover } = await import('./discover.server.js'));
		await db.insert(schema.profiles).values([
			{ id: ids.cook, username: handle.cook },
			{ id: ids.solo, username: handle.solo },
			{ id: ids.fan, username: `dfan-${run}` }
		]);
		// Oldest first, a minute apart, so newest first is known: 7 is newest.
		const recipe = (n: number, authorId: string) => ({
			authorId,
			slug: `dl-${run}-${n}`,
			title: `${word} number ${n}`,
			visibility: 'public' as const,
			updatedAt: new Date(Date.UTC(2021, 0, 1, 0, n))
		});
		const rows = await db
			.insert(schema.recipes)
			.values([1, 2, 3, 4, 5, 6, 7].map((n) => recipe(n, ids.cook)))
			.returning({ id: schema.recipes.id });
		cookIds = rows.map((r) => r.id);
		[{ id: soloId }] = await db
			.insert(schema.recipes)
			.values(recipe(8, ids.solo))
			.returning({ id: schema.recipes.id });
		// Saved this week, from the middle of the order: it leads.
		savedId = cookIds[3];
		await db.insert(schema.favorites).values({ userId: ids.fan, recipeId: savedId });
	});

	afterAll(async () => {
		if (!db) return;
		await db.delete(schema.recipes).where(inArray(schema.recipes.authorId, [ids.cook, ids.solo]));
		await db.delete(schema.profiles).where(inArray(schema.profiles.id, Object.values(ids)));
	});

	const discover = (search: string) =>
		loadDiscover(new URL(`http://localhost/discover?${search}`), { id: ids.fan });

	/** Every page by Show more's cursor: the lead, then each page's cards in order. */
	async function walk(search: string) {
		const first = await discover(search);
		const shown = [first.lead!.id, ...first.recipes.map((r) => r.id)];
		let next = first.next;
		while (next) {
			const page = await discover(`${search}&after=${encodeURIComponent(next)}`);
			expect(page.lead).toBeNull();
			shown.push(...page.recipes.map((r) => r.id));
			next = page.next;
		}
		return { first, shown };
	}

	test('by cursor, every recipe once: the most-saved leads and the grid is the rest, newest first', async () => {
		const { first, shown } = await walk(`q=${encodeURIComponent(`@${handle.cook}`)}&per=2`);
		expect(first.lead!.id).toBe(savedId);
		expect(first.total).toBe(cookIds.length);
		const rest = [...cookIds].reverse().filter((id) => id !== savedId);
		expect(shown).toEqual([savedId, ...rest]);
	});

	test('?page=N reads the same first N pages as the cursor did, the lead not among them', async () => {
		const data = await discover(`q=${encodeURIComponent(`@${handle.cook}`)}&per=2&page=2`);
		const rest = [...cookIds].reverse().filter((id) => id !== savedId);
		expect(data.recipes.map((r) => r.id)).toEqual(rest.slice(0, 4));
		expect(data.lead!.id).toBe(savedId);
		// The cursor after those pages carries on with the rest, nothing skipped.
		const after = await discover(
			`q=${encodeURIComponent(`@${handle.cook}`)}&per=2&after=${encodeURIComponent(data.next!)}`
		);
		expect(after.recipes.map((r) => r.id)).toEqual(rest.slice(4, 6));
	});

	test('ranked by a search, every match once by its offset, the lead not repeated', async () => {
		const { first, shown } = await walk(`q=${encodeURIComponent(`${word} @${handle.cook}`)}&per=2`);
		expect(first.total).toBe(cookIds.length);
		expect(first.lead!.id).toBe(savedId);
		expect([...shown].sort()).toEqual([...cookIds].sort());
		expect(new Set(shown).size).toBe(shown.length);
	});

	test('a set of one is the lead alone: an empty grid, a count of one', async () => {
		const data = await discover(`q=${encodeURIComponent(`@${handle.solo}`)}`);
		expect(data.lead!.id).toBe(soloId);
		expect(data.recipes).toEqual([]);
		expect(data.next).toBeNull();
		expect(data.total).toBe(1);
	});

	test('Recent changes lists each recipe once, at its newest change, newest first', async () => {
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		const [a, b] = cookIds;
		const at = (minute: number) => new Date(Date.UTC(2021, 0, 2, 0, minute));
		const version = (recipeId: number, versionNumber: number, minute: number) => ({
			recipeId,
			versionNumber,
			commitMessage: `v${versionNumber}`,
			...makeContent(),
			createdBy: ids.cook,
			createdAt: at(minute)
		});
		await db
			.insert(schema.recipeVersions)
			.values([
				version(a, 1, 0),
				version(a, 2, 1),
				version(b, 1, 0),
				version(b, 2, 2),
				version(a, 3, 3)
			]);
		const data = await discover(`q=${encodeURIComponent(`@${handle.cook}`)}`);
		expect(data.recentChanges.map((c) => [c.slug, c.versionNumber])).toEqual([
			[`dl-${run}-1`, 3],
			[`dl-${run}-2`, 2]
		]);
	});

	test('an empty set has no lead and no cards', async () => {
		const data = await discover(`q=${encodeURIComponent(`@${handle.solo} nothingmatches`)}`);
		expect(data.lead).toBeNull();
		expect(data.recipes).toEqual([]);
		expect(data.total).toBe(0);
	});
});
