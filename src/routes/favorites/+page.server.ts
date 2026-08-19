import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, favorites, tags, recipesToTags } from '$lib/server/db/schema';
import { eq, and, ilike, inArray } from 'drizzle-orm';
import { attachRecipeCounts } from '$lib/server/recipeCounts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) {
		throw redirect(303, '/login');
	}

	const searchQuery = url.searchParams.get('q') || '';
	const tagSlugs = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

	const favoriteMappings = await db
		.select({ recipeId: favorites.recipeId })
		.from(favorites)
		.where(eq(favorites.userId, user.id));

	const favoriteIds = favoriteMappings
		.map((f) => f.recipeId)
		.filter((id): id is number => id !== null);

	if (favoriteIds.length === 0) {
		return { favoriteRecipes: [], allTags: [], searchQuery, selectedTags: tagSlugs };
	}

	// Filter chips are scoped to tags that actually appear on this user's
	// favourites — a chip leading to an empty page is worse than no chip. Derived
	// from every favourite rather than the filtered subset, or narrowing by one
	// tag would remove the chips needed to widen the filter again.
	const allTags = await db
		.selectDistinct({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.innerJoin(recipesToTags, eq(recipesToTags.tagId, tags.id))
		.where(inArray(recipesToTags.recipeId, favoriteIds))
		.orderBy(tags.name);

	// Tag filtering is OR logic: a recipe qualifies on any selected tag, and
	// recipes matching more of them rank higher.
	const selectedTagIds = allTags.filter((t) => tagSlugs.includes(t.slug)).map((t) => t.id);
	const matchCounts = new Map<number, number>();
	let candidateIds = favoriteIds;

	if (selectedTagIds.length > 0) {
		const taggedRows = await db
			.select({ recipeId: recipesToTags.recipeId })
			.from(recipesToTags)
			.where(
				and(
					inArray(recipesToTags.tagId, selectedTagIds),
					inArray(recipesToTags.recipeId, favoriteIds)
				)
			);

		for (const row of taggedRows) {
			if (row.recipeId === null) continue;
			matchCounts.set(row.recipeId, (matchCounts.get(row.recipeId) ?? 0) + 1);
		}

		candidateIds = [...matchCounts.keys()];

		if (candidateIds.length === 0) {
			return { favoriteRecipes: [], allTags, searchQuery, selectedTags: tagSlugs };
		}
	}

	const conditions = [inArray(recipes.id, candidateIds)];
	if (searchQuery) {
		conditions.push(ilike(recipes.title, `%${searchQuery}%`));
	}

	const rows = await db.query.recipes.findMany({
		where: and(...conditions),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true
		}
	});

	// Counts come from the map built above, so ranking is O(n log n) rather than
	// rescanning the tag rows inside every comparison.
	if (matchCounts.size > 0) {
		rows.sort((a, b) => (matchCounts.get(b.id) ?? 0) - (matchCounts.get(a.id) ?? 0));
	}

	const withCounts = await attachRecipeCounts(rows);

	return { favoriteRecipes: withCounts, allTags, searchQuery, selectedTags: tagSlugs };
};
