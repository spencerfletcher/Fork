import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { eq, and, or, inArray, desc, exists, sql } from 'drizzle-orm';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { byTagMatches, tagMatchCounts, visibleTags } from '#lib/server/tagFilter.js';
import { clampDescription } from '#lib/seo.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	const searchQuery = url.searchParams.get('q')?.trim() || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	const searchMeta = (count: number) => ({
		title: searchQuery ? `“${searchQuery}” — Search` : 'Search',
		description: clampDescription(
			searchQuery
				? `${count} recipe${count === 1 ? '' : 's'} matching “${searchQuery}” on Fork.`
				: 'Search recipes by name, description or ingredient.'
		)
	});

	// Public recipes, or the user's own.
	const visibilityCondition = user
		? or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id))
		: eq(recipes.isPublic, true);

	const allTags = await visibleTags(visibilityCondition);

	// Tag filter: OR over the selected tags, ranked by how many matched below.
	let matchCounts = new Map<number, number>();
	if (tagSlugs.length > 0) {
		const tagIds = allTags.filter((t) => tagSlugs.includes(t.slug)).map((t) => t.id);
		if (tagIds.length > 0) matchCounts = await tagMatchCounts(tagIds);
		if (matchCounts.size === 0) {
			return { recipes: [], allTags, searchQuery, selectedTags: tagSlugs, meta: searchMeta(0) };
		}
	}

	// A recipe matches the query on its own text (the generated fts column) or on
	// an ingredient name in any of its versions. Text hits rank by relevance;
	// ingredient-only hits score zero there and follow, newest first.
	const tsQuery = searchQuery ? sql`websearch_to_tsquery('english', ${searchQuery})` : null;
	const textMatch = tsQuery
		? or(
				sql`${recipes.fts} @@ ${tsQuery}`,
				exists(
					db
						.select({ one: sql`1` })
						.from(recipeVersions)
						.where(
							and(
								eq(recipeVersions.recipeId, recipes.id),
								sql`to_tsvector('english', (
									SELECT coalesce(string_agg(ing->>'name', ' '), '')
									FROM jsonb_array_elements(${recipeVersions.ingredients}) AS ing
								)) @@ ${tsQuery}`
							)
						)
				)
			)
		: undefined;

	const rows = await db.query.recipes.findMany({
		where: and(
			visibilityCondition,
			matchCounts.size > 0 ? inArray(recipes.id, [...matchCounts.keys()]) : undefined,
			textMatch
		),
		with: { recipesToTags: { with: { tag: true } }, author: true },
		// Newest change first, the order browse uses; a ranked search keeps its
		// text rank and uses it as the tiebreak.
		orderBy: tsQuery
			? [sql`ts_rank(${recipes.fts}, ${tsQuery}) DESC`, desc(recipes.updatedAt)]
			: [desc(recipes.updatedAt)]
	});

	// Rank by how many selected tags matched, unless searching: FTS rank wins then.
	if (!searchQuery && matchCounts.size > 0) rows.sort(byTagMatches(matchCounts));

	const withCounts = await attachRecipeCounts(rows);

	return {
		recipes: withCounts,
		allTags,
		searchQuery,
		selectedTags: tagSlugs,
		meta: searchMeta(withCounts.length)
	};
};
