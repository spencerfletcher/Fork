import { db } from '$lib/server/db';
import { recipes, tags, recipesToTags, recipeVersions } from '$lib/server/db/schema';
import { eq, and, or, inArray, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const searchQuery = url.searchParams.get('q')?.trim() || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	// ── Visibility: public recipes, or the user's own ────────────────────────
	const visibilityCondition = user
		? or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id))
		: eq(recipes.isPublic, true);

	// ── Fetch tags up front — always needed for the filter UI ────────────────
	const allTags = await db.select().from(tags);

	// ── Tag filter: collect matching recipe IDs up front ─────────────────────
	let tagFilteredIds: number[] | null = null;
	let tagMappings: { recipeId: number }[] = [];

	if (tagSlugs.length > 0) {
		const selectedTags = allTags.filter((t) => tagSlugs.includes(t.slug));
		const tagIds = selectedTags.map((t) => t.id);

		if (tagIds.length > 0) {
			tagMappings = await db
				.select({ recipeId: recipesToTags.recipeId })
				.from(recipesToTags)
				.where(inArray(recipesToTags.tagId, tagIds));
			tagFilteredIds = [...new Set(tagMappings.map((m) => m.recipeId))];
		}

		// Tags specified but nothing matched — short-circuit
		if (!tagFilteredIds || tagFilteredIds.length === 0) {
			return { recipes: [], allTags, searchQuery, selectedTags: tagSlugs };
		}
	}

	const baseConditions = [visibilityCondition!];
	if (tagFilteredIds !== null) {
		baseConditions.push(inArray(recipes.id, tagFilteredIds));
	}

	// ── Search ───────────────────────────────────────────────────────────────
	let results: (typeof recipes.$inferSelect)[];

	if (searchQuery) {
		const tsQuery = sql`websearch_to_tsquery('english', ${searchQuery})`;

		// Pass 1: title + description FTS (ranked by ts_rank, highest first)
		const titleDescMatches = await db
			.select()
			.from(recipes)
			.where(and(...baseConditions, sql`${recipes.fts} @@ ${tsQuery}`))
			.orderBy(sql`ts_rank(${recipes.fts}, ${tsQuery}) DESC`, desc(recipes.createdAt));

		const titleDescIds = new Set(titleDescMatches.map((r) => r.id));

		// Pass 2: ingredient name FTS against recipe_versions JSONB
		// Extracts ingredient names from each version and searches them.
		// Only surfaces recipes not already in pass 1.
		const ingredientRows = await db
			.select({ recipeId: recipeVersions.recipeId })
			.from(recipeVersions)
			.where(
				sql`to_tsvector('english', (
					SELECT coalesce(string_agg(ing->>'name', ' '), '')
					FROM jsonb_array_elements(${recipeVersions.ingredients}) AS ing
				)) @@ ${tsQuery}`
			);

		const ingredientOnlyIds = [
			...new Set(
				ingredientRows
					.map((r) => r.recipeId)
					.filter((id): id is number => id !== null && !titleDescIds.has(id))
			)
		];

		let ingredientOnlyRecipes: (typeof recipes.$inferSelect)[] = [];
		if (ingredientOnlyIds.length > 0) {
			ingredientOnlyRecipes = await db
				.select()
				.from(recipes)
				.where(and(...baseConditions, inArray(recipes.id, ingredientOnlyIds)))
				.orderBy(desc(recipes.createdAt));
		}

		// Title/description hits first, ingredient-only hits appended after
		results = [...titleDescMatches, ...ingredientOnlyRecipes];
	} else {
		// No search query — return all visible/tag-filtered recipes
		results = await db
			.select()
			.from(recipes)
			.where(and(...baseConditions))
			.orderBy(desc(recipes.createdAt));
	}

	// ── Tag match count: sort by how many selected tags match ─────────────────
	// Only applied when not searching (FTS rank takes priority when searching)
	if (!searchQuery && tagMappings.length > 0) {
		results.sort((a, b) => {
			const countA = tagMappings.filter((m) => m.recipeId === a.id).length;
			const countB = tagMappings.filter((m) => m.recipeId === b.id).length;
			return countB - countA;
		});
	}

	return { recipes: results, allTags, searchQuery, selectedTags: tagSlugs };
};
