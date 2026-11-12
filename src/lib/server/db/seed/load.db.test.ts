import { describe, test, expect } from 'vitest';
import { closeDbAfter, localDb } from '#lib/testing/db.js';

closeDbAfter();

// The local database as `pnpm db:seed` left it, checked for the invariants the
// app's write paths keep. Read only: loading the seed inside a rolled-back
// transaction needs a wipe there, which deadlocks the other database tests
// running beside it. Run `pnpm db:seed` first; without the varied set it fails
// and says so.
describe.skipIf(!localDb)('the varied seed, against the real database', () => {
	test('loads, and every stored invariant holds', { timeout: 120_000 }, async () => {
		const { sql, eq, and, inArray, isNotNull } = await import('drizzle-orm');
		const s = await import('../schema.js');
		const { seedSlug } = await import('./load.js');
		const { VARIED_RECIPES } = await import('./recipes.js');
		const { inLibraryOf } = await import('../../visibility.js');
		const { recipeIdsIn } = await import('../../collections.js');
		const { notificationsFor } = await import('../../notifications.js');
		const { textSearch } = await import('../../recipeSearch.js');
		const { changedGroups, versionContent } = await import('#lib/recipes/content.js');
		const { slugify } = await import('#lib/helpers.js');

		const { db: tx } = await import('../index.js');
		{
			const profilesNow = await tx.select().from(s.profiles);
			const ids = Object.fromEntries(profilesNow.map((p) => [p.username, p.id]));
			// Only the seed's own rows: other tests may have left theirs in the dev database.
			const { VARIED_COOKS } = await import('./cooks.js');
			const seeded = ['spencerfletcher', 'devcooks', 'priyabakes', ...VARIED_COOKS].map(
				(c) => ids[c]
			);
			expect(ids.mei_lin, 'the varied seed is loaded: run pnpm db:seed').toBeDefined();

			const { SEED } = await import('../seedData.js');
			const keys = [...SEED.map((r) => r.slug), ...VARIED_RECIPES.map((r) => r.key)];
			const rows = (await tx.select().from(s.recipes)).filter((r) =>
				keys.some((k) => new RegExp(`^${k}-[0-9a-f-]{8}$`).test(r.slug))
			);
			const versions = await tx.select().from(s.recipeVersions);
			const of = (id: number) =>
				versions.filter((v) => v.recipeId === id).sort((a, b) => a.versionNumber - b.versionNumber);

			// The row copies its latest version; versions number 1..n; every save bumped the revision.
			for (const r of rows.filter((r) => !r.erasedAt)) {
				const vs = of(r.id);
				expect(
					vs.map((v) => v.versionNumber),
					r.slug
				).toEqual(vs.map((_, i) => i + 1));
				const latest = vs.at(-1)!;
				expect(
					{ title: r.title, description: r.description, servings: r.servings },
					r.slug
				).toEqual({
					title: latest.title,
					description: latest.description,
					servings: latest.servings
				});
				expect([r.prepTimeMinutes, r.cookTimeMinutes, r.imageUrl], r.slug).toEqual([
					latest.prepTimeMinutes,
					latest.cookTimeMinutes,
					latest.imageUrl
				]);
				expect(r.editRevision, r.slug).toBeGreaterThanOrEqual(vs.length - 1);
				expect(r.updatedAt.getTime(), r.slug).toBeGreaterThanOrEqual(r.createdAt.getTime());
			}

			// A varied fork's v1 is its parent's copied version, word for word.
			const bySlug = new Map(rows.map((r) => [r.slug, r]));
			for (const recipe of VARIED_RECIPES.filter((r) => r.forkOf)) {
				const fork = bySlug.get(seedSlug(recipe.key))!;
				const parent = rows.find((r) => r.id === fork.parentId)!;
				expect(fork.parentVersion).toBe(recipe.forkOf!.version);
				const copied = of(parent.id)[fork.parentVersion! - 1];
				expect(
					changedGroups(versionContent(copied), versionContent(of(fork.id)[0])),
					recipe.key
				).toEqual([]);
				expect(of(fork.id)[0].commitMessage).toBe('');
			}

			// Tags as tagIdsFor makes them.
			for (const t of await tx
				.select()
				.from(s.tags)
				.where(
					inArray(
						s.tags.id,
						tx
							.select({ id: s.recipesToTags.tagId })
							.from(s.recipesToTags)
							.where(
								inArray(
									s.recipesToTags.recipeId,
									rows.map((r) => r.id)
								)
							)
					)
				))
				expect(t.slug, t.name).toBe(slugify(t.name));

			// Saves keep only versions that exist; copies only of withdrawn recipes, never the author's.
			const saves = (await tx.select().from(s.favorites)).filter((f) =>
				rows.some((r) => r.id === f.recipeId)
			);
			for (const f of saves) {
				const r = rows.find((r) => r.id === f.recipeId)!;
				const n = of(r.id).length;
				if (f.keptVersion !== null) expect(f.keptVersion).toBeLessThanOrEqual(n);
				if (f.copyVersion !== null) {
					expect(r.visibility === 'private' || r.deletedAt !== null, r.slug).toBe(true);
					expect(f.userId).not.toBe(r.authorId);
				}
			}
			const copies = saves.filter(
				(f) => f.copyVersion !== null && f.userId === ids.spencerfletcher
			);
			expect(copies.length).toBeGreaterThanOrEqual(2);

			// The Journal's versions belong to the recipe the entry names.
			for (const e of await tx
				.select()
				.from(s.logEntries)
				.where(and(isNotNull(s.logEntries.versionId), inArray(s.logEntries.userId, seeded))))
				expect(versions.find((v) => v.id === e.versionId)?.recipeId).toBe(e.recipeId);

			// Collections hold only recipes in their owner's library.
			for (const c of await tx
				.select()
				.from(s.collections)
				.where(inArray(s.collections.ownerId, seeded))) {
				const members = await tx
					.select()
					.from(s.collectionRecipes)
					.where(eq(s.collectionRecipes.collectionId, c.id));
				const visible = await recipeIdsIn({ id: c.ownerId }, c.id, tx);
				expect(visible?.length, c.name).toBe(members.length);
			}

			// The main cook's Cookbook is a full one.
			const library = await tx.$count(s.recipes, inLibraryOf({ id: ids.spencerfletcher }));
			expect(library).toBeGreaterThanOrEqual(50);
			expect(library).toBeLessThanOrEqual(100);

			// Trashed inside and past the 30 days, a hidden one, kinds of report.
			const trashed = rows.filter((r) => r.deletedAt);
			const day = 86_400_000;
			expect(trashed.some((r) => Date.now() - r.deletedAt!.getTime() < 30 * day)).toBe(true);
			expect(trashed.some((r) => Date.now() - r.deletedAt!.getTime() > 30 * day)).toBe(true);
			expect(rows.filter((r) => r.suppressedAt)).toHaveLength(1);
			const kinds = new Set((await tx.select().from(s.reports)).map((r) => r.targetType));
			expect([...kinds].sort()).toEqual(['link', 'log_entry', 'recipe', 'user']);

			// News for him of every kind For you shows; whether it is still unseen
			// depends on whether he has opened Friends since the seed ran.
			const news = await notificationsFor({ id: ids.spencerfletcher }, { limit: 50, conn: tx });
			for (const kind of ['request', 'accepted', 'like', 'save', 'fork'])
				expect(news.map((n) => n.kind)).toContain(kind);

			// Search reads the seeded versions through its functions.
			const found = await tx
				.select({ slug: s.recipes.slug })
				.from(s.recipes)
				.where(and(textSearch('kimchi').where, inArray(s.recipes.visibility, ['public'])));
			expect(found.map((r) => r.slug)).toContain(seedSlug('napa-kimchi'));

			// Every Journal summary month for him has something.
			const [{ months }] = await tx.execute<{ months: number }>(
				sql`select count(distinct date_trunc('month', cooked_on))::int as months from log_entries where user_id = ${ids.spencerfletcher} and cooked_on > now() - interval '12 months'`
			);
			expect(months).toBeGreaterThanOrEqual(10);
		}
	});
});
