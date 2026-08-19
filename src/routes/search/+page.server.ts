import { db } from '$lib/server/db';
import { recipes, tags, recipesToTags, recipeVersions } from '$lib/server/db/schema';
import { eq, and, or, inArray, desc, sql } from 'drizzle-orm';
import { attachRecipeCounts } from '$lib/server/recipeCounts';
import { clampDescription } from '$lib/seo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const searchQuery = url.searchParams.get('q')?.trim() || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	const searchMeta = (count: number) => ({
		title: searchQuery ? `“${searchQuery}” — search` : 'Search',
		description: clampDescription(
			searchQuery
				? `${count} recipe${count === 1 ? '' : 's'} matching “${searchQuery}” on Fork.`
				: 'Search recipes by name, description or ingredient.'
		)
	});

	// ── Visibility: public recipes, or the user's own ────────────────────────
	const visibilityCondition = user
		? or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id))
		: eq(recipes.isPublic, true);

	// ── Fetch tags up front — always needed for the filter UI ────────────────
	// Only tags that actually match something; a filter chip that leads to an
	// empty page is worse than no chip. Tags drop off this list on their own
	// when their last recipe goes away.
	const allTags = await db
		.selectDistinct({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.innerJoin(recipesToTags, eq(recipesToTags.tagId, tags.id))
		.orderBy(tags.name);

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
			return { recipes: [], allTags, searchQuery, selectedTags: tagSlugs, meta: searchMeta(0) };
		}
	}

	const baseConditions = [visibilityCondition];
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

	// ── Hydrate relations ─────────────────────────────────────────────────────
	// The ranking above works on bare recipe rows. RecipeCard needs author and
	// tags, so re-fetch the ranked ids with relations and restore the order —
	// Postgres does not preserve inArray ordering.
	const rankedIds = results.map((r) => r.id);

	const rows =
		rankedIds.length > 0
			? await db.query.recipes.findMany({
					where: inArray(recipes.id, rankedIds),
					with: {
						recipesToTags: { with: { tag: true } },
						author: true
					}
				})
			: [];

	const byId = new Map(rows.map((r) => [r.id, r]));
	const hydrated = rankedIds.map((id) => byId.get(id)).filter((r) => r !== undefined);

	const withCounts = await attachRecipeCounts(hydrated);

	return {
		recipes: withCounts,
		allTags,
		searchQuery,
		selectedTags: tagSlugs,
		meta: searchMeta(withCounts.length)
	};
};
