import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';

import { closeDbAfter, localDb, stamp } from '#lib/testing/db.js';
import { formEvent, invokeAction, loadEvent, loadPage } from '#lib/testing/actions.js';
import type { PageData } from './$types';

closeDbAfter();

// What the saver's page data carries of a recipe its author withdrew and then
// rewrote: committed rows (the load reads through the pool) between two seed
// profiles, removed after.
describe.skipIf(!localDb)('a kept copy in the page data, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let load: typeof import('./+page.server.js').load;
	const run = stamp();
	const copySlug = `page-kept-${run}`;
	const liveSlug = `page-live-${run}`;
	let author: string;
	let saver: string;
	// Words the author wrote after withdrawing it, which the saver was never given.
	// Words of its own: the Cookbook db test runs beside this one on the same seed profiles.
	const LATER = /numbat|xylograph|gossamer|quince/i;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		({ load } = await import('./+page.server.js'));
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		const profiles = await db.query.profiles.findMany({ limit: 2 });
		if (profiles.length < 2) throw new Error('Seed the local database first (pnpm db:seed)');
		[author, saver] = profiles.map((p) => p.id);
		const rows = await db
			.insert(schema.recipes)
			.values([
				{
					authorId: author,
					slug: copySlug,
					title: 'Xylograph numbat',
					description: 'Gossamer quince',
					servings: 9,
					editRevision: 7,
					visibility: 'private'
				},
				{ authorId: author, slug: liveSlug, title: 'Soup', visibility: 'public' }
			])
			.returning({ id: schema.recipes.id });
		await db.insert(schema.recipeVersions).values(
			rows.map(({ id }) => ({
				recipeId: id,
				versionNumber: 1,
				commitMessage: 'v',
				...makeContent({ title: 'Soup v1', description: 'As saved' }),
				createdBy: author
			}))
		);
		await db
			.insert(schema.favorites)
			.values({ userId: saver, recipeId: rows[0].id, copyVersion: 1 });
	});

	afterAll(async () => {
		if (db)
			await db.delete(schema.recipes).where(inArray(schema.recipes.slug, [copySlug, liveSlug]));
	});

	const pageOf = (slug: string, userId: string) =>
		loadPage<PageData>(
			load,
			loadEvent({ path: `/recipes/${slug}`, user: { id: userId }, params: { slug } })
		);

	test("the copy's page data holds the kept version and the row's identity, nothing the author wrote later", async () => {
		const data = await pageOf(copySlug, saver);
		expect(data.keptCopy).toBe(true);
		expect(data.recipe).toMatchObject({ title: 'Soup v1', editRevision: 0 });
		const json = JSON.stringify(data);
		expect(json).not.toMatch(LATER);
		expect(Object.keys(data.recipe).sort()).toEqual(
			[
				'author',
				'authorId',
				'cookTimeMinutes',
				'description',
				'editRevision',
				'id',
				'imageUrl',
				'parent',
				'parentDeleted',
				'parentId',
				'parentVersion',
				'prepTimeMinutes',
				'recipesToTags',
				'servings',
				'slug',
				'title',
				'versions'
			].sort()
		);
	});

	test("an ordinary recipe's page data carries no search vector", async () => {
		const data = await pageOf(liveSlug, saver);
		expect(data.recipe).not.toHaveProperty('fts');
	});

	test("the recall line is the reader's own note for next time; another cook's never reaches their page data", async () => {
		const live = await db.query.recipes.findFirst({ where: eq(schema.recipes.slug, liveSlug) });
		const entries = await db
			.insert(schema.logEntries)
			.values([
				{
					userId: author,
					recipeId: live!.id,
					dish: 'Soup',
					cookedOn: '2026-11-01',
					note: `Wombat ${run}`
				},
				{
					userId: saver,
					recipeId: live!.id,
					dish: 'Soup',
					cookedOn: '2026-11-02',
					note: `Less ginger ${run}`
				}
			])
			.returning({ id: schema.logEntries.id });
		try {
			const [mine, theirs] = await Promise.all([pageOf(liveSlug, saver), pageOf(liveSlug, author)]);
			expect(mine.journal?.lastNote).toMatchObject({
				note: `Less ginger ${run}`,
				versionNumber: null
			});
			expect(JSON.stringify(mine)).not.toContain('Wombat');
			expect(theirs.journal?.lastNote).toMatchObject({ note: `Wombat ${run}` });
			expect(JSON.stringify(theirs)).not.toContain('Less ginger');
			const signedOut = await loadPage<PageData>(
				load,
				loadEvent({ path: `/recipes/${liveSlug}`, params: { slug: liveSlug } })
			);
			expect(JSON.stringify(signedOut)).not.toMatch(/Wombat|Less ginger/);
		} finally {
			await db.delete(schema.logEntries).where(
				inArray(
					schema.logEntries.id,
					entries.map((e) => e.id)
				)
			);
		}
	});
});

describe.skipIf(!localDb)("a fork's page data, against the real database", () => {
	let rows: Awaited<ReturnType<typeof import('#lib/testing/ftsLeak.js').parentAndFork>>;
	beforeAll(async () => {
		rows = await (await import('#lib/testing/ftsLeak.js')).parentAndFork();
	});
	afterAll(async () => {
		await rows?.remove();
	});

	test('the serialised parent carries no search vector', async () => {
		const { load } = await import('./+page.server.js');
		const data = await loadPage<PageData>(
			load,
			loadEvent({ path: `/recipes/${rows.forkSlug}`, params: { slug: rows.forkSlug } })
		);
		expect(data.recipe.parent).not.toBeNull();
		expect(JSON.stringify(data)).not.toContain('"fts"');
	});
});

// Exact origins: a fork records the parent version it copied, and every
// reader of it names that version. Committed rows between three fresh
// profiles (the action and the load read through the pool), removed after.
describe.skipIf(!localDb)('forking a version, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let page: typeof import('./+page.server.js');
	const run = stamp();
	const [author, forker, other] = ['author', 'forker', 'other'].map((p) => `test-ex-${p}-${run}`);
	const people = [author, forker, other];
	const parentSlug = `exact-parent-${run}`;
	const photo = (n: number) =>
		`http://127.0.0.1:54321/storage/v1/object/public/recipe-images/${author}/${run}-v${n}.png`;
	// Each version's words its own, so a copy shows which one it read.
	const WORDS = ['quokka', 'wombat', 'platypus'];
	let parentId: number;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		page = await import('./+page.server.js');
		const { makeContent } = await import('#lib/recipes/fixtures.js');
		await db
			.insert(schema.profiles)
			.values(people.map((id) => ({ id, username: id.replace('test-ex-', 'ex-') })));
		[{ id: parentId }] = await db
			.insert(schema.recipes)
			.values({ authorId: author, slug: parentSlug, title: 'platypus stew', visibility: 'public' })
			.returning({ id: schema.recipes.id });
		await db.insert(schema.recipeVersions).values(
			WORDS.map((word, i) => ({
				recipeId: parentId,
				versionNumber: i + 1,
				commitMessage: `v${i + 1}`,
				...makeContent({ title: `${word} stew`, imageUrl: photo(i + 1) }),
				createdBy: author
			}))
		);
	});

	afterAll(async () => {
		if (!db) return;
		await db.delete(schema.recipes).where(inArray(schema.recipes.authorId, people));
		await db.delete(schema.recipes).where(eq(schema.recipes.id, parentId));
		// The author's name before the rename test, kept reserved to them.
		await db
			.delete(schema.formerUsernames)
			.where(inArray(schema.formerUsernames.profileId, people));
		await db.delete(schema.profiles).where(inArray(schema.profiles.id, people));
	});

	/** The forker forks the parent with `fields`; the refusal, or the new fork's row. */
	async function fork(fields: Record<string, string> = {}) {
		const result = await invokeAction(
			page.actions.fork as never,
			formEvent({ fields, params: { slug: parentSlug }, locals: { user: { id: forker } } })
		);
		const slug = /^\/recipes\/([^/]+)\/edit$/.exec(String(result.location))?.[1];
		if (!slug) return { result, row: undefined };
		const row = await db.query.recipes.findFirst({
			where: eq(schema.recipes.slug, slug),
			with: { versions: true }
		});
		return { result, row };
	}

	const pageOf = (slug: string, user: { id: string } | null, query = '') =>
		loadPage<PageData>(
			page.load,
			loadEvent({ path: `/recipes/${slug}${query}`, user, params: { slug } })
		);

	test('forking v2 copies v2, photo included, and records it; with no version it is the latest', async () => {
		const { row } = await fork({ version: '2' });
		expect(row).toMatchObject({ parentId, parentVersion: 2, title: 'wombat stew' });
		expect(row!.versions).toMatchObject([
			{
				versionNumber: 1,
				title: 'wombat stew',
				imageUrl: photo(2),
				// No handle stored: v1's line is read from the parent.
				commitMessage: ''
			}
		]);
		const data = await pageOf(row!.slug, { id: forker });
		expect(data.allVersions.map((v) => v.commitMessage)).toEqual([
			`Forked from @ex-author-${run}, v2`
		]);
		expect(data.currentVersion.commitMessage).toBe(`Forked from @ex-author-${run}, v2`);
		const latest = await fork();
		expect(latest.row).toMatchObject({ parentVersion: 3, title: 'platypus stew' });
	});

	test('a version the parent does not have, or not a number, is refused and makes nothing', async () => {
		const before = await db.$count(schema.recipes, eq(schema.recipes.authorId, forker));
		expect((await fork({ version: '9' })).result).toMatchObject({ status: 404 });
		expect((await fork({ version: 'two' })).result).toMatchObject({ status: 400 });
		expect(await db.$count(schema.recipes, eq(schema.recipes.authorId, forker))).toBe(before);
	});

	test('across accounts: every reader of the public fork is pointed at v2, whose page shows v2; a hidden parent names nothing', async () => {
		const { row } = await fork({ version: '2' });
		await db
			.update(schema.recipes)
			.set({ visibility: 'public' })
			.where(eq(schema.recipes.id, row!.id));
		for (const viewer of [{ id: forker }, { id: other }, null]) {
			const data = await pageOf(row!.slug, viewer);
			expect(data.recipe).toMatchObject({ parentVersion: 2, parent: { slug: parentSlug } });
			const parentAt = await pageOf(parentSlug, viewer, '?version=2');
			expect(parentAt.currentVersion).toMatchObject({ versionNumber: 2, title: 'wombat stew' });
		}
		const signedOut = await pageOf(row!.slug, null);
		expect(signedOut.meta.jsonLd?.isBasedOn).toContain(
			`http://localhost/recipes/${parentSlug}?version=2`
		);
		// The parent's history is its own: forking appended nothing to it.
		expect(
			await db.$count(schema.recipeVersions, eq(schema.recipeVersions.recipeId, parentId))
		).toBe(3);

		await db
			.update(schema.recipes)
			.set({ visibility: 'private' })
			.where(eq(schema.recipes.id, parentId));
		try {
			for (const viewer of [{ id: other }, null]) {
				const data = await pageOf(row!.slug, viewer);
				expect(data.recipe).toMatchObject({ parent: null, parentDeleted: false });
				expect(data.meta.jsonLd?.isBasedOn).toBeUndefined();
			}
		} finally {
			await db
				.update(schema.recipes)
				.set({ visibility: 'public' })
				.where(eq(schema.recipes.id, parentId));
		}
	});

	test('search finds the fork by its own words; the forker exports it with its origin, a saver by reference', async () => {
		const { row } = await fork({ version: '1' });
		const { textSearch } = await import('#lib/server/recipeSearch.js');
		const { visibleTo } = await import('#lib/server/visibility.js');
		const found = await db
			.select({ id: schema.recipes.id })
			.from(schema.recipes)
			.where(and(textSearch('quokka').where, visibleTo({ id: forker })));
		expect(found.map((r) => r.id)).toContain(row!.id);

		const { exportFor } = await import('#lib/server/export.js');
		const { toMarkdown } = await import('#lib/export/markdown.js');
		const mine = await exportFor(forker, 'https://x', row!.id);
		expect(mine.recipes[0].forkedFrom).toMatchObject({ slug: parentSlug, version: 1 });
		expect(toMarkdown(mine)).toContain(
			`Forked from [platypus stew](https://x/recipes/${parentSlug}?version=1), v1 by @ex-author-${run}`
		);

		await db
			.update(schema.recipes)
			.set({ visibility: 'public' })
			.where(eq(schema.recipes.id, row!.id));
		await db.insert(schema.favorites).values({ userId: other, recipeId: row!.id });
		const saved = (await exportFor(other, 'https://x')).saves.find((s) => s.slug === row!.slug);
		expect(saved).toMatchObject({ title: 'quokka stew', author: `ex-forker-${run}` });
	});

	test("the byline's parent author: the current handle after a rename, and none for a hidden parent", async () => {
		const { row } = await fork({ version: '2' });
		await db
			.update(schema.recipes)
			.set({ visibility: 'public' })
			.where(eq(schema.recipes.id, row!.id));
		const { changeUsername } = await import('#lib/server/profiles.js');
		const renamed = `ex-rn-${run}`;
		expect(await changeUsername(author, renamed)).toMatchObject({ result: 'changed' });
		const data = await pageOf(row!.slug, { id: other });
		// The profile join's one column, nothing else of the profile.
		expect(data.recipe.parent?.author).toEqual({ username: renamed });
		// The history's first entry follows the rename too, as does the export.
		expect(data.currentVersion.commitMessage).toBe(`Forked from @${renamed}, v2`);
		const { exportFor } = await import('#lib/server/export.js');
		const { toMarkdown } = await import('#lib/export/markdown.js');
		const mine = await exportFor(forker, 'https://x', row!.id);
		expect(mine.recipes[0].versions[0].message).toBe(`Forked from @${renamed}, v2`);
		expect(toMarkdown(mine)).toContain(`· Forked from @${renamed}, v2`);

		await db
			.update(schema.recipes)
			.set({ visibility: 'private' })
			.where(eq(schema.recipes.id, parentId));
		try {
			for (const viewer of [{ id: other }, null]) {
				const hidden = await pageOf(row!.slug, viewer);
				expect(hidden.recipe.parent).toBeNull();
				expect(hidden.currentVersion.commitMessage).toBe('Forked from a private recipe, v2');
				expect(JSON.stringify(hidden)).not.toContain(`"username":"${renamed}"`);
			}
		} finally {
			await db
				.update(schema.recipes)
				.set({ visibility: 'public' })
				.where(eq(schema.recipes.id, parentId));
		}
	});

	test("the parent deleted for good keeps the fork's copied photo and its v2 record; the fork reads as from a deleted recipe", async () => {
		const { row } = await fork({ version: '2' });
		const removed: string[] = [];
		const supabase = {
			storage: {
				from: () => ({
					remove: async (paths: string[]) => {
						removed.push(...paths);
						return { error: null };
					}
				})
			}
		} as never;
		const { deleteForever, moveToTrash } = await import('#lib/server/trash.js');
		await moveToTrash({ id: parentId, authorId: author });
		await deleteForever(parentId, supabase);
		expect(await db.$count(schema.recipes, eq(schema.recipes.id, parentId))).toBe(0);
		expect(removed.join(' ')).not.toContain(`${run}-v2.png`);
		const data = await pageOf(row!.slug, { id: forker });
		expect(data.recipe).toMatchObject({ parentVersion: 2, parent: null, parentDeleted: true });
		expect(data.currentVersion.commitMessage).toBe('Forked from a deleted recipe, v2');
		expect(data.currentVersion.imageUrl).toBe(photo(2));
	});
});
