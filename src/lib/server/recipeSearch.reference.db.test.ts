import { describe, test, expect, beforeAll } from 'vitest';
import { and, desc, inArray, sql, type SQL } from 'drizzle-orm';

import { closeDbAfter, inRollback, localDb, stamp } from '#lib/testing/db.js';
import type { Tx } from '#lib/server/db/index.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { recipes } from './db/schema.js';

closeDbAfter();

// The matcher as it was before the search indexes (commit 447089a), kept here
// only as the reference the indexed one must agree with: it parses every
// version's text per row, which no index serves.
const oldNames = (v: string) =>
	`coalesce((SELECT string_agg(i->>'name', ' ') FROM jsonb_array_elements(${v}.ingredients) i), '')`;
const oldNotesOf = (v: string) =>
	`concat_ws(' ', ${v}.notes, ${v}.make_ahead, ${v}.equipment, ${v}.storage, ${v}.reheating)`;
const oldDoc = (v: string) =>
	sql.raw(
		`to_tsvector('english', concat_ws(' ', ${v}.title, ${v}.description, ${v}.source_name, ${oldNames(v)}, ` +
			`(SELECT string_agg(s->>'text', ' ') FROM jsonb_array_elements(${v}.steps) s), ${oldNotesOf(v)}))`
	);
const recipeId = sql.raw('"recipes"."id"');
const oldLatest = sql`(SELECT * FROM recipe_versions cv WHERE cv.recipe_id = ${recipeId} ORDER BY cv.version_number DESC LIMIT 1) cur`;
function oldTier(query: string): SQL {
	const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
	return sql`(CASE
		WHEN lower(${recipes.title}) = lower(${query}) THEN 0
		WHEN starts_with(lower(${recipes.title}), lower(${query}))
			OR to_tsvector('english', ${recipes.title}) @@ ${tsQuery} THEN 1
		WHEN EXISTS (SELECT 1 FROM ${oldLatest} WHERE to_tsvector('english', ${sql.raw(oldNames('cur'))}) @@ ${tsQuery}) THEN 2
		WHEN EXISTS (SELECT 1 FROM ${oldLatest} WHERE ${oldDoc('cur')} @@ ${tsQuery}) THEN 3
		WHEN EXISTS (SELECT 1 FROM recipe_versions v WHERE v.recipe_id = ${recipeId} AND ${oldDoc('v')} @@ ${tsQuery}) THEN 4
	END)`;
}
function oldTextSearch(query: string): { where: SQL; rank: SQL[] } {
	const rank = oldTier(query);
	return {
		where: sql`${rank} IS NOT NULL`,
		rank: [
			sql`${rank}`,
			sql`(SELECT count(*) FROM favorites f WHERE f.recipe_id = ${recipeId}) DESC`
		]
	};
}

// Overlapping words across titles, ingredients, steps, notes, sources and old
// versions; accents, punctuation, phrases, negation, OR, stop words, prefixes.
const QUERIES = [
	'ginger',
	'Ginger',
	'GINGER SNAPS',
	'ging',
	'ginger snaps',
	'"ginger snaps"',
	'"snaps ginger"',
	'ginger -milk',
	'milk -ginger',
	'-ginger',
	'ginger or saffron',
	'saffron',
	'cinnamon',
	'crème',
	'creme',
	'Crème brûlée',
	'brûlée',
	'jalapeño',
	"o'brien",
	'café-style',
	'the',
	'pig',
	'spice cake',
	'Spice',
	'tomato, basil',
	'cake',
	'gloves',
	'zzzz'
];

describe.skipIf(!localDb)('the indexed matcher against the matcher it replaced', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let search: typeof import('./recipeSearch.js');
	let fx: typeof import('#lib/recipes/fixtures.js');
	let vis: typeof import('./visibility.js');
	let userId: string;
	const run = stamp();

	beforeAll(async () => {
		const { db } = await import('#lib/server/db/index.js');
		schema = await import('#lib/server/db/schema.js');
		search = await import('./recipeSearch.js');
		fx = await import('#lib/recipes/fixtures.js');
		vis = await import('./visibility.js');
		const profile = await db.query.profiles.findFirst();
		if (!profile) throw new Error('Seed the local database first (pnpm db:seed)');
		userId = profile.id;
	});

	async function insert(
		tx: Tx,
		name: string,
		versions: Partial<RecipeContent>[],
		row: Partial<typeof recipes.$inferInsert> = {}
	) {
		const contents = versions.map((v) => fx.makeContent({ title: name, ...v }));
		const latest = contents[contents.length - 1];
		const [{ id }] = await tx
			.insert(schema.recipes)
			.values({
				slug: `ref-${run}-${Math.random().toString(36).slice(2)}`,
				authorId: userId,
				title: latest.title,
				description: latest.description,
				visibility: 'public',
				...row
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

	async function corpus(tx: Tx) {
		const { makeIngredient: ing, makeStep: step } = fx;
		const ids = [
			await insert(tx, 'Ginger', [{}]),
			await insert(tx, 'Ginger snaps', [
				{ ingredients: [ing('100 g butter'), ing('2 tsp ground ginger')] }
			]),
			await insert(tx, 'Crème brûlée', [
				{
					ingredients: [ing('500 ml cream'), ing('4 egg yolks')],
					steps: [step('Caramelise the sugar.')]
				}
			]),
			await insert(tx, 'Stir fry', [
				{ ingredients: [ing('1 tbsp fresh ginger')], steps: [step('Splash in a little milk.')] }
			]),
			await insert(tx, 'Spice cake', [
				{ ingredients: [ing('1 pinch saffron')] },
				{ ingredients: [ing('2 tsp cinnamon')], description: 'No saffron any more? It was.' },
				{ ingredients: [ing('2 tsp cinnamon')] }
			]),
			await insert(tx, 'Fish and chips', [
				{ description: "O'Brien's café-style, with ginger beer." }
			]),
			await insert(tx, 'Jalapeño poppers', [
				{ notes: 'Wear gloves.', sourceName: 'The Ginger Pig', makeAhead: 'Stuff a day ahead.' }
			]),
			await insert(tx, 'Tomato, basil soup', [
				{
					steps: [step('Grate some ginger'), step('snaps of basil on top.')],
					equipment: 'A blender'
				}
			]),
			await insert(tx, 'Milk bread', [{ ingredients: [ing('250 ml milk'), ing('ginger')] }]),
			await insert(tx, 'Gingerbread', [{ title: 'Treacle loaf' }, {}]),
			await insert(tx, 'Plain bread', [{}]),
			// Erased while a saver keeps a copy: the row blanked, its versions kept.
			await insert(tx, 'Ginger cake', [{ ingredients: [ing('ginger')] }], {
				title: '',
				description: null,
				deletedAt: new Date(),
				erasedAt: new Date()
			})
		];
		// Saves break ties inside a tier.
		await tx.insert(schema.favorites).values([
			{ userId, recipeId: ids[3] },
			{ userId, recipeId: ids[8] }
		]);
		return ids;
	}

	const ranked = (tx: Tx, ids: number[], m: { where: SQL | undefined; rank: SQL[] }) =>
		tx
			.select({ id: schema.recipes.id, tier: sql<number | null>`${m.rank[0]}`.mapWith(Number) })
			.from(schema.recipes)
			.where(and(inArray(schema.recipes.id, ids), m.where))
			.orderBy(...m.rank, desc(schema.recipes.id));

	test('every query finds the same recipes, at the same tier, in the same order', async () => {
		await inRollback(async (tx) => {
			const ids = await corpus(tx);
			for (const q of QUERIES) {
				const now = await ranked(tx, ids, search.textSearch(q));
				const before = await ranked(tx, ids, oldTextSearch(q));
				expect({ q, rows: now }).toEqual({ q, rows: before });
			}
			// The corpus exercises every arm: a negated word hides the ingredient
			// only outside the names, an old version alone, the title's start.
			const tiers = async (q: string) =>
				(await ranked(tx, ids, search.textSearch(q))).map((r) => r.tier);
			expect(await tiers('ginger -milk')).toContain(2);
			expect(await tiers('saffron')).toEqual([4]);
			expect(await tiers('ging')).toContain(1);
		});
	});

	test('the erased recipe matches as before, and no viewer finds it', async () => {
		await inRollback(async (tx) => {
			const ids = await corpus(tx);
			const erased = ids[ids.length - 1];
			const { where } = search.textSearch('ginger');
			const anyone = await tx
				.select({ id: schema.recipes.id })
				.from(schema.recipes)
				.where(and(inArray(schema.recipes.id, ids), where, vis.visibleTo({ id: userId })));
			expect(anyone.map((r) => r.id)).not.toContain(erased);
		});
	});

	test('the indexed text of each version is the text the old matcher parsed', async () => {
		await inRollback(async (tx) => {
			const ids = await corpus(tx);
			const differ = await tx.execute(sql`SELECT v.id FROM recipe_versions v
				WHERE v.recipe_id IN ${ids}
				AND (recipe_version_doc(v.title, v.description, v.source_name, v.ingredients, v.steps,
					v.notes, v.make_ahead, v.equipment, v.storage, v.reheating) IS DISTINCT FROM ${oldDoc('v')}
				OR to_tsvector('english', recipe_ingredient_names(v.ingredients))
					IS DISTINCT FROM to_tsvector('english', ${sql.raw(oldNames('v'))}))`);
			expect([...differ]).toEqual([]);
		});
	});
});
