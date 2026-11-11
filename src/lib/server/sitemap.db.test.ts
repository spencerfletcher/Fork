import { describe, test, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { closeDbAfter, localDb, stamp, withProfiles } from '#lib/testing/db.js';
import type { Visibility } from '#lib/recipes/validation.js';

closeDbAfter();

const ORIGIN = 'https://fork.test';

// Runs only against the local Supabase stack, inside a transaction that is
// always rolled back. The database holds other rows too, so each test asserts
// on its own recipes and cooks only.
describe.skipIf(!localDb)('sitemapUrls, against the real database', () => {
	type Tx = import('./db/index.js').Tx;
	let schema: typeof import('#lib/server/db/schema.js');
	let sitemapUrls: typeof import('./sitemap.js').sitemapUrls;

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		({ sitemapUrls } = await import('./sitemap.js'));
	});

	async function recipe(tx: Tx, authorId: string, visibility: Visibility) {
		const [row] = await tx
			.insert(schema.recipes)
			.values({ authorId, slug: `map-${visibility}-${stamp()}`, title: 'T', visibility })
			.returning({ id: schema.recipes.id, slug: schema.recipes.slug });
		return row;
	}

	test('lists home, Discover, public recipes and the cooks who show one; nothing a signed-out visitor cannot open', async () => {
		await withProfiles(3, async (tx, [cook, privateCook, saver]) => {
			const open = await recipe(tx, cook, 'public');
			const friends = await recipe(tx, cook, 'friends');
			const hidden = await recipe(tx, privateCook, 'private');
			const trashed = await recipe(tx, cook, 'public');
			const erased = await recipe(tx, cook, 'public');
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date() })
				.where(eq(schema.recipes.id, trashed.id));
			await tx
				.update(schema.recipes)
				.set({ deletedAt: new Date(), erasedAt: new Date() })
				.where(eq(schema.recipes.id, erased.id));
			// A saver's kept copy of a recipe made private: theirs alone.
			const withdrawn = await recipe(tx, privateCook, 'private');
			await tx
				.insert(schema.favorites)
				.values({ userId: saver, recipeId: withdrawn.id, copyVersion: 1 });

			const urls = await sitemapUrls(ORIGIN, tx);
			const locs = urls.map((u) => u.loc);
			const usernames = await tx
				.select({ id: schema.profiles.id, username: schema.profiles.username })
				.from(schema.profiles);
			const nameOf = (id: string) => usernames.find((p) => p.id === id)!.username;

			expect(locs.slice(0, 2)).toEqual([`${ORIGIN}/`, `${ORIGIN}/discover`]);
			expect(locs).toContain(`${ORIGIN}/recipes/${open.slug}`);
			for (const r of [friends, hidden, trashed, erased, withdrawn])
				expect(locs).not.toContain(`${ORIGIN}/recipes/${r.slug}`);
			expect(locs).toContain(`${ORIGIN}/users/${nameOf(cook)}`);
			for (const id of [privateCook, saver])
				expect(locs).not.toContain(`${ORIGIN}/users/${nameOf(id)}`);
			expect(urls.find((u) => u.loc.endsWith(open.slug))?.lastmod).toBeInstanceOf(Date);
		});
	});

	test("a handle or slug is percent-encoded in its URL, as the page's own path is", async () => {
		await withProfiles(1, async (tx, [cook]) => {
			await tx
				.update(schema.profiles)
				.set({ username: `a&b ${stamp()}` })
				.where(eq(schema.profiles.id, cook));
			const open = await recipe(tx, cook, 'public');
			await tx
				.update(schema.recipes)
				.set({ slug: `x&y-${open.slug}` })
				.where(eq(schema.recipes.id, open.id));
			const locs = (await sitemapUrls(ORIGIN, tx)).map((u) => u.loc);
			expect(locs).toContain(`${ORIGIN}/recipes/${encodeURIComponent(`x&y-${open.slug}`)}`);
			expect(locs.some((l) => l.startsWith(`${ORIGIN}/users/a%26b%20`))).toBe(true);
		});
	});
});
