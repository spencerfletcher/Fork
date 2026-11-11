import { describe, test, expect, beforeAll } from 'vitest';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import type { Visibility } from '#lib/recipes/validation.js';
import { EXPORT_FORMAT, EXPORT_VERSION } from '#lib/export/archive.js';

closeDbAfter();

const ORIGIN = 'https://fork.test';

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('the export, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let ex: typeof import('./export.js');
	let fixtures: typeof import('#lib/recipes/fixtures.js');
	let versionContent: typeof import('#lib/recipes/content.js').versionContent;
	type Tx = import('./db/index.js').Tx;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		ex = await import('./export.js');
		fixtures = await import('#lib/recipes/fixtures.js');
		({ versionContent } = await import('#lib/recipes/content.js'));
	});

	let n = 0;
	/** A recipe whose versions are `contents`, oldest first. */
	async function makeRecipe(
		tx: Tx,
		authorId: string,
		contents: RecipeContent[],
		values: Partial<typeof schema.recipes.$inferInsert> = {}
	) {
		const slug = `export-${Date.now()}-${n++}`;
		const [row] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug, title: contents.at(-1)!.title, ...values })
			.returning({ id: schema.recipes.id });
		await tx.insert(schema.recipeVersions).values(
			contents.map((content, i) => ({
				recipeId: row.id,
				versionNumber: i + 1,
				commitMessage: `message ${i + 1}`,
				...content,
				createdBy: authorId
			}))
		);
		return { id: row.id, slug };
	}

	/** Through the wire: what a reader of the downloaded file holds. */
	const parsed = async (tx: Tx, userId: string, recipeId?: number) =>
		JSON.parse(JSON.stringify(await ex.exportFor(userId, ORIGIN, recipeId, tx))) as Awaited<
			ReturnType<typeof ex.exportFor>
		>;

	test('round trip: every version parses back to the content the database holds, groups and notes included', async () => {
		await withProfiles(1, async (tx, [me]) => {
			const buns = fixtures.makeBuns();
			const contents = [
				fixtures.makeBuns({ title: 'Buns', restTimeMinutes: null, steps: buns.steps.slice(0, 1) }),
				fixtures.makeBuns({ makes: '10 buns' }),
				buns
			];
			const { id, slug } = await makeRecipe(tx, me, contents, { visibility: 'private' });
			const stored = await tx.query.recipeVersions.findMany({
				where: (v, { eq }) => eq(v.recipeId, id),
				orderBy: (v, { asc }) => [asc(v.versionNumber)]
			});

			const out = await parsed(tx, me);
			const recipe = out.recipes.find((r) => r.slug === slug)!;
			expect(recipe.versions.map((v) => v.content)).toEqual(stored.map(versionContent));
			expect(recipe.versions.map((v) => [v.number, v.message, v.date])).toEqual(
				stored.map((v) => [v.versionNumber, v.commitMessage, v.createdAt.toISOString()])
			);
			expect(recipe.versions.at(-1)!.content).toEqual(buns);
			expect(recipe.url).toBe(`${ORIGIN}/recipes/${slug}`);
			expect(recipe.audience).toBe('private');
		});
	});

	test('the shape: format, version and every top-level key, the profile by handle', async () => {
		await withProfiles(1, async (tx, [me], stamp) => {
			const out = await parsed(tx, me);
			expect(out).toMatchObject({
				format: EXPORT_FORMAT,
				version: EXPORT_VERSION,
				scope: 'library',
				profile: { username: `a-${stamp}`, url: `${ORIGIN}/users/a-${stamp}` }
			});
			expect(Object.keys(out).sort()).toEqual(
				[
					'collections',
					'exportedAt',
					'format',
					'journal',
					'profile',
					'recipes',
					'saves',
					'scope',
					'version'
				].sort()
			);
		});
	});

	test('private and trashed recipes are the cook’s and go out, the trashed marked; erased ones and other cooks’ never', async () => {
		await withProfiles(2, async (tx, [me, other], stamp) => {
			const trashedAt = new Date('2026-11-01T10:00:00Z');
			const live = await makeRecipe(tx, me, [fixtures.makeContent()], { visibility: 'private' });
			const trashed = await makeRecipe(tx, me, [fixtures.makeContent()], { deletedAt: trashedAt });
			const erased = await makeRecipe(tx, me, [fixtures.makeContent()], {
				deletedAt: trashedAt,
				erasedAt: trashedAt
			});
			const theirs = `theirs-${stamp}`;
			await makeRecipe(tx, other, [fixtures.makeContent({ description: theirs })], {
				visibility: 'public'
			});

			const out = await parsed(tx, me);
			const bySlug = new Map(out.recipes.map((r) => [r.slug, r]));
			expect(bySlug.get(live.slug)!.inTrashSince).toBeNull();
			expect(bySlug.get(trashed.slug)!.inTrashSince).toBe(trashedAt.toISOString());
			expect(bySlug.has(erased.slug)).toBe(false);
			expect(JSON.stringify(out)).not.toContain(theirs);
		});
	});

	test('saves are references with the cook’s note; a kept copy is named, its content never exported', async () => {
		await withProfiles(2, async (tx, [me, other], stamp) => {
			const word = `word-${stamp}`;
			const pub = await makeRecipe(
				tx,
				other,
				[fixtures.makeContent({ title: 'Public one', description: word })],
				{
					visibility: 'public'
				}
			);
			// Withdrawn after the save: the cook keeps v1, the author has written v2 since.
			const copy = await makeRecipe(
				tx,
				other,
				[
					fixtures.makeContent({ title: 'Kept title', description: word }),
					fixtures.makeContent({ title: 'Later title', description: word })
				],
				{ visibility: 'private' }
			);
			await tx.insert(schema.favorites).values([
				{ userId: me, recipeId: pub.id, keptVersion: 1, note: 'Less sugar.' },
				{ userId: me, recipeId: copy.id, copyVersion: 1 }
			]);

			const out = await parsed(tx, me);
			const saves = new Map(out.saves.map((s) => [s.slug, s]));
			expect(saves.get(pub.slug)).toMatchObject({
				title: 'Public one',
				author: `b-${stamp}`,
				url: `${ORIGIN}/recipes/${pub.slug}`,
				keptVersion: 1,
				keptCopy: null,
				note: 'Less sugar.'
			});
			expect(saves.get(copy.slug)).toMatchObject({ title: 'Kept title', keptCopy: 1 });
			const text = JSON.stringify(out);
			expect(text).not.toContain(word);
			expect(text).not.toContain('Later title');
			expect(out.recipes).toEqual([]);
		});
	});

	test('a save the cook may no longer see is left out', async () => {
		await withProfiles(2, async (tx, [me, other]) => {
			const hidden = await makeRecipe(tx, other, [fixtures.makeContent({ title: 'Narrowed' })], {
				visibility: 'private'
			});
			await tx.insert(schema.favorites).values({ userId: me, recipeId: hidden.id });
			const out = await parsed(tx, me);
			expect(out.saves).toEqual([]);
			expect(JSON.stringify(out)).not.toContain('Narrowed');
		});
	});

	test('collections list their recipes, own and saved, by reference', async () => {
		await withProfiles(2, async (tx, [me, other]) => {
			const mine = await makeRecipe(tx, me, [fixtures.makeContent({ title: 'Mine' })]);
			const saved = await makeRecipe(tx, other, [fixtures.makeContent({ title: 'Saved' })], {
				visibility: 'public'
			});
			await tx.insert(schema.favorites).values({ userId: me, recipeId: saved.id });
			const [shelf] = await tx
				.insert(schema.collections)
				.values({ ownerId: me, name: 'Weeknights' })
				.returning({ id: schema.collections.id });
			await tx.insert(schema.collectionRecipes).values([
				{ collectionId: shelf.id, recipeId: mine.id },
				{ collectionId: shelf.id, recipeId: saved.id }
			]);

			const out = await parsed(tx, me);
			expect(out.collections).toHaveLength(1);
			expect(out.collections[0].name).toBe('Weeknights');
			expect(out.collections[0].recipes.map((r) => [r.slug, r.title]).sort()).toEqual(
				[
					[mine.slug, 'Mine'],
					[saved.slug, 'Saved']
				].sort()
			);
		});
	});

	test('the Journal: each entry with its day, notes, photo and source, as the cook sees it', async () => {
		await withProfiles(2, async (tx, [me, other], stamp) => {
			const own = await makeRecipe(tx, me, [fixtures.makeContent({ title: 'Own' })]);
			const [v] = await tx.query.recipeVersions.findMany({
				where: (r, { eq }) => eq(r.recipeId, own.id)
			});
			const secret = `secret-${stamp}`;
			const hidden = await makeRecipe(tx, other, [fixtures.makeContent({ title: secret })], {
				visibility: 'private'
			});
			await tx.insert(schema.logEntries).values([
				{
					userId: me,
					recipeId: own.id,
					versionId: v.id,
					dish: 'Own dinner',
					cookedOn: '2026-11-02',
					servings: 6,
					note: 'Doubled.',
					photoUrl: 'https://example.com/dinner.jpg'
				},
				{
					userId: me,
					dish: 'From a blog',
					cookedOn: '2026-11-03',
					sourceUrl: 'https://blog.example/x'
				},
				{ userId: me, dish: 'Freestyle', cookedOn: '2026-11-04' },
				{ userId: me, recipeId: hidden.id, dish: 'Theirs', cookedOn: '2026-11-05' },
				{ userId: other, dish: `other-${stamp}`, cookedOn: '2026-11-05' }
			]);

			const out = await parsed(tx, me);
			const byDish = new Map(out.journal.map((e) => [e.dish, e]));
			expect(byDish.get('Own dinner')).toMatchObject({
				cookedOn: '2026-11-02',
				servings: 6,
				note: 'Doubled.',
				photoUrl: 'https://example.com/dinner.jpg',
				source: { kind: 'recipe', slug: own.slug, title: 'Own', version: 1 }
			});
			expect(byDish.get('From a blog')!.source).toEqual({
				kind: 'link',
				url: 'https://blog.example/x'
			});
			expect(byDish.get('Freestyle')!.source).toEqual({ kind: 'improvised' });
			expect(byDish.get('Theirs')!.source).toEqual({ kind: 'hidden' });
			const text = JSON.stringify(out);
			expect(text).not.toContain(secret);
			expect(text).not.toContain(`other-${stamp}`);
		});
	});

	test('a fork names its parent when the cook may see it; hidden or deleted otherwise', async () => {
		await withProfiles(2, async (tx, [me, other], stamp) => {
			const fork = (parentId: number) => makeRecipe(tx, me, [fixtures.makeContent()], { parentId });
			const parent = (title: string, visibility: Visibility) =>
				makeRecipe(tx, other, [fixtures.makeContent({ title })], { visibility });
			const seen = await parent('Seen parent', 'public');
			const unseen = await parent(`unseen-${stamp}`, 'private');
			const a = await fork(seen.id);
			const b = await fork(unseen.id);
			const c = await fork(2_000_000_000);

			const out = await parsed(tx, me);
			const from = new Map(out.recipes.map((r) => [r.slug, r.forkedFrom]));
			expect(from.get(a.slug)).toEqual({
				slug: seen.slug,
				url: `${ORIGIN}/recipes/${seen.slug}`,
				title: 'Seen parent',
				author: `b-${stamp}`,
				// A fork from before the copied version was recorded.
				version: null
			});
			expect(from.get(b.slug)).toBe('hidden');
			expect(from.get(c.slug)).toBe('deleted');
			expect(JSON.stringify(out)).not.toContain(`unseen-${stamp}`);
		});
	});

	test('one recipe: that recipe alone with all its versions and tags, nothing else', async () => {
		await withProfiles(1, async (tx, [me], stamp) => {
			const one = await makeRecipe(tx, me, [fixtures.makeContent(), fixtures.makeBuns()]);
			const two = await makeRecipe(tx, me, [fixtures.makeContent()]);
			const [tag] = await tx
				.insert(schema.tags)
				.values({ name: `Baking ${stamp}`, slug: `baking-${stamp}` })
				.returning({ id: schema.tags.id });
			await tx.insert(schema.recipesToTags).values({ recipeId: one.id, tagId: tag.id });
			await tx.insert(schema.logEntries).values({ userId: me, dish: 'D', cookedOn: '2026-11-04' });

			const out = await parsed(tx, me, one.id);
			expect(out.scope).toBe('recipe');
			expect(out.recipes.map((r) => r.slug)).toEqual([one.slug]);
			expect(out.recipes[0].versions).toHaveLength(2);
			expect(out.recipes[0].tags).toEqual([`Baking ${stamp}`]);
			expect([out.collections, out.saves, out.journal]).toEqual([[], [], []]);
			expect(JSON.stringify(out)).not.toContain(two.slug);
		});
	});
});
