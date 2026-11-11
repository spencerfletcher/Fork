import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions, recipesToTags, favorites } from '#lib/server/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { slugify, randomSuffix, plural, wholeNumber } from '#lib/helpers.js';
import { ensureProfile } from '#lib/server/profiles.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { recipeCopies } from '#lib/recipes/content.js';
import { absoluteImage, clampDescription } from '#lib/seo.js';
import { gramsFor } from '#lib/server/ingredientDensities.js';
import { canViewRow, friendIdsOnce, viewableRecipe } from '#lib/server/visibility.js';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { lastEntryFor } from '#lib/server/journal.js';
import { VERSION_NOT_FOUND } from './versionError.js';
import { failure, SESSION_ENDED } from '#lib/server/actions.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	const recipeSlug = params.slug;
	const versionParam = url.searchParams.get('version');

	// One friends lookup serves both access checks below.
	const friends = friendIdsOnce(user);
	const recipe = await viewableRecipe(
		recipeSlug,
		user,
		{
			recipesToTags: { with: { tag: true } },
			author: true,
			parent: { with: { author: true } },
			versions: {
				orderBy: [desc(recipeVersions.versionNumber)],
				with: { creator: true }
			}
		},
		friends
	);
	if (!recipe) throw error(404, 'Recipe not found');

	// A public fork can come from a private recipe. Readers who can't see that
	// recipe get no parent data at all; parentId alone lets the page say so.
	// parentId has no FK, so a deleted parent leaves it pointing at no row; one
	// in the Trash reads as deleted too, until it is restored.
	const parentVisible = recipe.parent !== null && (await canViewRow(recipe.parent, user, friends));
	const visibleRecipe = {
		...recipe,
		parent: parentVisible ? recipe.parent : null,
		parentDeleted: recipe.parentId !== null && (recipe.parent === null || !!recipe.parent.deletedAt)
	};

	// Resolve which version's content to display. Creation and forking write a
	// version in the same transaction as the recipe, so every recipe has one.
	const latestVersion = recipe.versions[0];
	const requestedVersion = versionParam ? wholeNumber(versionParam) : null;
	if (versionParam && requestedVersion === null) throw error(404, VERSION_NOT_FOUND);
	const currentVersion =
		requestedVersion === null
			? latestVersion
			: recipe.versions.find((v) => v.versionNumber === requestedVersion);
	if (!currentVersion) throw error(404, VERSION_NOT_FOUND);

	// Independent lookups, one round trip. The fork count is the forks the
	// viewer can see, the cards' and the forks page's rule (visibleTo), so no
	// fork they cannot open shows in the number.
	const [favorite, [{ forkCount }], favoriteCount, lastEntry] = await Promise.all([
		user
			? db.query.favorites.findFirst({
					where: and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id))
				})
			: undefined,
		attachRecipeCounts([recipe], user),
		db.$count(favorites, eq(favorites.recipeId, recipe.id)),
		// The personal line: the reader's latest log entry of this recipe.
		user ? lastEntryFor(user.id, recipe.id) : null
	]);
	const isFavorited = !!favorite;

	return {
		recipe: visibleRecipe,
		currentVersion,
		forkCount,
		favoriteCount,
		// Weights come from local tables at load time, so the page never pays for
		// an external lookup; lines the tables do not know get null.
		grams: currentVersion.ingredients.map(gramsFor),
		allVersions: recipe.versions,
		isFavorited,
		/** Signed in: the personal line's data; signed out there is no line. */
		journal: user
			? {
					lastEntry,
					// Add to Journal prefills the version being read.
					addHref: `/journal/new?recipe=${encodeURIComponent(recipe.slug)}&version=${currentVersion.versionNumber}`
				}
			: null,
		meta: {
			title: currentVersion.title,
			description: clampDescription(
				currentVersion.description ??
					`${currentVersion.title} on Fork — ${plural(recipe.versions.length, 'version')}, with the full history of what changed and why.`
			),
			image: absoluteImage(currentVersion.imageUrl),
			type: 'article' as const
		}
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ params, locals: { user } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('try again'));

		const recipe = await viewableRecipe(params.slug, user);
		if (!recipe) throw error(404, 'Recipe not found');

		// Unfavorite if it was a favorite; otherwise nothing was deleted, so favorite it.
		const removed = await db
			.delete(favorites)
			.where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id)))
			.returning({ recipeId: favorites.recipeId });
		if (removed.length === 0) {
			await db.insert(favorites).values({ userId: user.id, recipeId: recipe.id });
		}
	},

	fork: async ({ params, locals: { user } }) => {
		if (!user) return failure(401, 'unauthenticated', SESSION_ENDED('try again'));

		const source = await viewableRecipe(params.slug, user, {
			versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 },
			recipesToTags: true,
			author: true
		});
		if (!source) throw error(404, 'Source recipe not found');

		const latestVersion = source.versions[0];

		// Forking is one click. The first version says where the copy came from;
		// the forker writes a message of their own when they change something.
		const from = source.author ? `@${source.author.username}, ` : '';
		const commitMessage = `Forked from ${from}v${latestVersion.versionNumber}`;

		await ensureProfile(user);

		// One snapshot of the latest version is the whole content of the fork;
		// the source row contributes only its settings and lineage.
		const copies = recipeCopies(latestVersion);
		const { makes, ingredients, steps } = latestVersion;
		const snapshot: RecipeContent = { ...copies, makes, ingredients, steps };
		const slug = `${slugify(snapshot.title)}-${randomSuffix()}`;

		let newSlug: string | null = null;

		await db.transaction(async (tx) => {
			const [newRecipe] = await tx
				.insert(recipes)
				.values({
					authorId: user.id,
					slug,
					// Copies of version 1, per the ownership rule in schema.ts.
					...copies,
					// Every fork starts private; the editor may widen it up to the source's audience.
					visibility: 'private',
					parentId: source.id
				})
				.returning();

			if (source.recipesToTags.length > 0) {
				await tx.insert(recipesToTags).values(
					source.recipesToTags.map((rt) => ({
						recipeId: newRecipe.id,
						tagId: rt.tagId
					}))
				);
			}

			await tx.insert(recipeVersions).values({
				recipeId: newRecipe.id,
				versionNumber: 1,
				commitMessage,
				...snapshot,
				createdBy: user.id
			});

			newSlug = newRecipe.slug;
		});

		throw redirect(303, `/recipes/${newSlug}/edit`);
	}
};
