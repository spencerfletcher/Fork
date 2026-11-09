import { eq, inArray, or, sql } from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import { recipesToTags, tags } from './db/schema.js';
import { slugify } from '#lib/helpers.js';

/** Every tag, alphabetical, for the recipe form's suggestions. */
export function listTags() {
	return db.query.tags.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
}

/**
 * Makes `tagNames` the recipe's tags. Names are matched to existing tags
 * case-insensitively, or by the slug they make, and the stored spelling wins,
 * so "dessert", "Dessert" and "dessert!" are one tag; only names that match
 * nothing are created, one per slug, since a slug is unique.
 */
export async function syncTags(tx: Tx, recipeId: number, tagNames: string[]): Promise<void> {
	await tx.delete(recipesToTags).where(eq(recipesToTags.recipeId, recipeId));
	if (tagNames.length === 0) return;

	const lower = tagNames.map((name) => name.toLowerCase());
	const slugs = tagNames.map(slugify);
	const existing = await tx
		.select({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.where(or(inArray(sql`lower(${tags.name})`, lower), inArray(tags.slug, slugs)));
	const idByLower = new Map(existing.map((t) => [t.name.toLowerCase(), t.id]));
	const idBySlug = new Map(existing.map((t) => [t.slug, t.id]));
	const idOf = (name: string) => idByLower.get(name.toLowerCase()) ?? idBySlug.get(slugify(name));

	const unmatched = tagNames.filter((name) => idOf(name) === undefined);
	const missing = unmatched.filter(
		(name, i) => unmatched.findIndex((other) => slugify(other) === slugify(name)) === i
	);
	if (missing.length > 0) {
		const created = await tx
			.insert(tags)
			.values(missing.map((name) => ({ name, slug: slugify(name) })))
			.returning({ id: tags.id, slug: tags.slug });
		for (const t of created) idBySlug.set(t.slug, t.id);
	}

	// Two names can resolve to one tag; the join holds it once.
	const tagIds = [...new Set(tagNames.map((name) => idOf(name)!))];
	await tx.insert(recipesToTags).values(tagIds.map((tagId) => ({ recipeId, tagId })));
}
