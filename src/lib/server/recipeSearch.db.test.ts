import { describe, test, expect, beforeAll } from 'vitest';
import { and, inArray } from 'drizzle-orm';

import { closeDbAfter, inRollback, localDb } from '#lib/testing/db.js';
import type { Tx } from '#lib/server/db/index.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { MARK_END, MARK_START } from '#lib/highlight.js';

closeDbAfter();

const plain = (s: string | undefined) => s?.replaceAll(MARK_START, '[').replaceAll(MARK_END, ']');

// Runs only against the local Supabase stack; recipeSearch.test.ts covers the SQL's shape.
describe.skipIf(!localDb)('search ranking and explanations, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let schema: typeof import('#lib/server/db/schema.js');
	let search: typeof import('./recipeSearch.js');
	let fx: typeof import('#lib/recipes/fixtures.js');
	let userId: string;
	const stamp = Date.now();

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		schema = await import('#lib/server/db/schema.js');
		search = await import('./recipeSearch.js');
		fx = await import('#lib/recipes/fixtures.js');
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
	});

	/** A recipe whose versions are `versions`, oldest first; the recipe row copies the last. */
	async function insert(tx: Tx, name: string, versions: Partial<RecipeContent>[]) {
		const contents = versions.map((v) => fx.makeContent({ title: name, ...v }));
		const latest = contents[contents.length - 1];
		const [{ id }] = await tx
			.insert(schema.recipes)
			.values({
				slug: `search-${stamp}-${name.toLowerCase().replace(/\W+/g, '-')}`,
				authorId: userId,
				title: latest.title,
				description: latest.description
			})
			.returning({ id: schema.recipes.id });
		await tx.insert(schema.recipeVersions).values(
			contents.map((content, i) => ({
				recipeId: id,
				versionNumber: i + 1,
				commitMessage: 'v',
				...content,
				createdBy: userId
			}))
		);
		return id;
	}

	const ginger = (tx: Tx) =>
		Promise.all([
			insert(tx, 'Old ginger cake', [
				{ title: 'Spice cake', ingredients: [fx.makeIngredient('2 tsp ground ginger')] },
				{ title: 'Spice cake', ingredients: [fx.makeIngredient('2 tsp cinnamon')] }
			]),
			insert(tx, 'Carrot soup', [{ description: 'Warm, with a little ginger.' }]),
			insert(tx, 'Stir fry', [{ ingredients: [fx.makeIngredient('1 tbsp fresh ginger')] }]),
			insert(tx, 'Ginger snaps', [{}]),
			insert(tx, 'Ginger', [{}]),
			insert(tx, 'Noodles', [
				{ steps: [fx.makeStep('Boil the noodles.'), fx.makeStep('Grate the ginger over them.')] }
			]),
			insert(tx, 'Plain bread', [{}])
		]);

	test('exact title, then title words, then a current ingredient, then description or method, then an older version', async () => {
		await inRollback(async (tx) => {
			const [older, soup, stirFry, snaps, exact, noodles] = await ginger(tx);
			// The soup is saved once, so popularity puts it before the noodles at the same tier.
			await tx.insert(schema.favorites).values({ userId, recipeId: soup });
			const text = search.textSearch('ginger');
			const ids = [older, soup, stirFry, snaps, exact, noodles];
			// Through the relational query, as cardList runs it, so its alias rebinding is exercised.
			const rows = await tx.query.recipes.findMany({
				where: and(inArray(schema.recipes.id, [...ids, ids[0] + 1000000]), text.where),
				orderBy: text.orderBy,
				columns: { id: true }
			});
			expect(rows.map((r) => r.id)).toEqual([exact, snaps, stirFry, soup, noodles, older]);
		});
	});

	test('a recipe that matches nowhere, in no version, is not found', async () => {
		await inRollback(async (tx) => {
			const ids = await ginger(tx);
			const bread = ids[ids.length - 1];
			const rows = await tx.query.recipes.findMany({
				where: and(inArray(schema.recipes.id, ids), search.textSearch('ginger').where),
				columns: { id: true }
			});
			expect(rows.map((r) => r.id)).not.toContain(bread);
			expect(rows).toHaveLength(ids.length - 1);
		});
	});

	test('each result says why it matched, the words marked', async () => {
		await inRollback(async (tx) => {
			const [older, soup, stirFry, snaps, exact, noodles] = await ginger(tx);
			const why = await search.searchMatches(
				'ginger',
				[older, soup, stirFry, snaps, exact, noodles],
				tx
			);
			const shown = (id: number) => {
				const m = why.get(id);
				return { title: plain(m?.title), label: m?.label, text: plain(m?.text) };
			};
			expect(shown(exact)).toEqual({ title: '[Ginger]', label: undefined, text: undefined });
			expect(shown(snaps)).toEqual({ title: '[Ginger] snaps', label: undefined, text: undefined });
			expect(shown(stirFry)).toEqual({
				title: 'Stir fry',
				label: 'Ingredient',
				text: 'fresh [ginger]'
			});
			expect(shown(soup)).toMatchObject({ label: 'Description' });
			expect(shown(soup).text).toContain('[ginger]');
			expect(shown(noodles)).toMatchObject({ label: 'Method, step 2' });
			expect(shown(noodles).text).toContain('[ginger]');
			expect(shown(older)).toEqual({
				title: 'Spice cake',
				label: 'In an older version (v1)',
				text: 'ground [ginger]'
			});
		});
	});

	test('the notes and the source match with the other text, and say so', async () => {
		await inRollback(async (tx) => {
			const notes = await insert(tx, 'Pork pie', [{ storage: 'Wrap in greaseproof, not ginger.' }]);
			const source = await insert(tx, 'Sausage roll', [{ sourceName: 'The Ginger Pig' }]);
			const text = search.textSearch('ginger');
			const rows = await tx.query.recipes.findMany({
				where: and(inArray(schema.recipes.id, [notes, source]), text.where),
				columns: { id: true }
			});
			expect(rows.map((r) => r.id).sort()).toEqual([notes, source].sort());
			const why = await search.searchMatches('ginger', [notes, source], tx);
			expect(why.get(notes)).toMatchObject({ label: 'Notes' });
			expect(plain(why.get(notes)?.text)).toContain('[ginger]');
			expect(why.get(source)).toMatchObject({ label: 'Source' });
			expect(plain(why.get(source)?.text)).toBe('The [Ginger] Pig');
		});
	});

	test('a prefix of the title ranks with the title and is marked', async () => {
		await inRollback(async (tx) => {
			const [, , , snaps, exact] = await ginger(tx);
			const why = await search.searchMatches('ging', [snaps, exact], tx);
			expect(plain(why.get(snaps)?.title)).toBe('[Ginger] snaps');
		});
	});
});
