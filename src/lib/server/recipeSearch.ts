import { desc, or, sql, type SQL } from 'drizzle-orm';
import { recipes, recipeVersions } from './db/schema.js';

/** The `?q=` and `?tags=` filters shared by Search and Favorites. */
export function parseFilters(url: URL): { searchQuery: string; tagSlugs: string[] } {
	return {
		searchQuery: url.searchParams.get('q')?.trim() || '',
		tagSlugs: url.searchParams.get('tags')?.split(',').filter(Boolean) || []
	};
}

/**
 * A recipe matches the query on its own text (the generated fts column) or on
 * an ingredient name in any of its versions. Text hits rank by relevance;
 * ingredient-only hits score zero there and follow, newest first. Without a
 * query everything matches, newest change first, the order browse uses.
 */
export function textSearch(query: string): { where: SQL | undefined; orderBy: SQL[] } {
	if (!query) return { where: undefined, orderBy: [desc(recipes.updatedAt)] };
	const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
	const where = or(
		sql`${recipes.fts} @@ ${tsQuery}`,
		sql`exists (
			SELECT 1 FROM ${recipeVersions}
			WHERE ${recipeVersions.recipeId} = ${recipes.id}
			AND to_tsvector('english', (
				SELECT coalesce(string_agg(ing->>'name', ' '), '')
				FROM jsonb_array_elements(${recipeVersions.ingredients}) AS ing
			)) @@ ${tsQuery}
		)`
	);
	return {
		where,
		orderBy: [sql`ts_rank(${recipes.fts}, ${tsQuery}) DESC`, desc(recipes.updatedAt)]
	};
}
