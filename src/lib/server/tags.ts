import { eq, inArray, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { recipesToTags, tags } from './db/schema.js';
import { slugify } from '#lib/helpers.js';

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Makes `tagNames` the recipe's tags. Names are matched to existing tags
 * case-insensitively and the stored spelling wins, so "dessert" and "Dessert"
 * are one tag; only names that match nothing are created.
 */
export async function syncTags(tx: Tx, recipeId: number, tagNames: string[]): Promise<void> {
	await tx.delete(recipesToTags).where(eq(recipesToTags.recipeId, recipeId));
	if (tagNames.length === 0) return;

	const lower = tagNames.map((name) => name.toLowerCase());
	const existing = await tx
		.select({ id: tags.id, name: tags.name })
		.from(tags)
		.where(inArray(sql`lower(${tags.name})`, lower));
	const idByLower = new Map(existing.map((t) => [t.name.toLowerCase(), t.id]));

	const missing = tagNames.filter((name) => !idByLower.has(name.toLowerCase()));
	if (missing.length > 0) {
		const created = await tx
			.insert(tags)
			.values(missing.map((name) => ({ name, slug: slugify(name) })))
			.returning({ id: tags.id, name: tags.name });
		for (const t of created) idByLower.set(t.name.toLowerCase(), t.id);
	}

	await tx
		.insert(recipesToTags)
		.values(tagNames.map((name) => ({ recipeId, tagId: idByLower.get(name.toLowerCase())! })));
}
