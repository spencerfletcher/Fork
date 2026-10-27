import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions, recipesToTags, favorites } from '#lib/server/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { slugify } from '#lib/helpers.js';
import { ensureProfile } from '#lib/server/profiles.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { absoluteImage, clampDescription } from '#lib/seo.js';
import { gramsFor } from '#lib/server/ingredientDensities.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	const recipeSlug = params.slug;
	const versionParam = url.searchParams.get('version');
	const requestedVersion = versionParam ? parseInt(versionParam, 10) : null;

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, recipeSlug),
		with: {
			recipesToTags: { with: { tag: true } },
			author: true,
			parent: { with: { author: true } },
			versions: {
				orderBy: [desc(recipeVersions.versionNumber)],
				with: { creator: true }
			}
		}
	});

	if (!recipe) throw error(404, 'Recipe not found');
	if (!recipe.isPublic && recipe.authorId !== user?.id) throw error(404, 'Recipe not found');

	// A public fork can come from a private recipe. Readers who can't see that
	// recipe get no parent data at all; parentId alone lets the page say so.
	const parentVisible =
		recipe.parent !== null && (recipe.parent.isPublic || recipe.parent.authorId === user?.id);
	const visibleRecipe = { ...recipe, parent: parentVisible ? recipe.parent : null };

	// Resolve which version's content to display
	let currentVersion = recipe.versions[0] ?? null;
	let isViewingHistory = false;

	if (requestedVersion !== null) {
		const found = recipe.versions.find((v) => v.versionNumber === requestedVersion);
		if (!found) throw error(404, 'Version not found');
		currentVersion = found;
		isViewingHistory = found.versionNumber !== recipe.versions[0]?.versionNumber;
	}

	// Check if the current user has favorited this recipe
	let isFavorited = false;
	if (user) {
		const existing = await db.query.favorites.findFirst({
			where: and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id))
		});
		isFavorited = !!existing;
	}

	// Title and description belong to the version on screen, not the recipe's copy of the latest.
	const shown = currentVersion ?? recipe;

	return {
		recipe: visibleRecipe,
		currentVersion,
		// Weights come from local tables at load time, so the page never pays for
		// an external lookup; lines the tables do not know get null.
		grams: currentVersion?.ingredients.map(gramsFor) ?? [],
		allVersions: recipe.versions,
		isViewingHistory,
		isFavorited,
		meta: {
			title: shown.title,
			description: clampDescription(
				shown.description ??
					`${shown.title} on Fork — ${recipe.versions.length} version${recipe.versions.length === 1 ? '' : 's'}, with the full history of what changed and why.`
			),
			image: absoluteImage(recipe.imageUrl),
			type: 'article' as const
		}
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ params, locals: { user } }) => {
		if (!user) throw error(401, 'Login required');

		const recipe = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug)
		});
		if (!recipe) throw error(404, 'Recipe not found');
		if (!recipe.isPublic && recipe.authorId !== user.id) throw error(404, 'Recipe not found');

		const existing = await db.query.favorites.findFirst({
			where: and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id))
		});

		if (existing) {
			await db
				.delete(favorites)
				.where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id)));
		} else {
			await db.insert(favorites).values({ userId: user.id, recipeId: recipe.id });
		}
	},

	fork: async ({ params, locals: { user }, request }) => {
		if (!user) throw error(401, 'Login required to fork a recipe');

		const formData = await request.formData();
		const commitMessage = (formData.get('commitMessage') as string)?.trim() || 'Forked recipe';

		// Load source recipe + latest version
		const source = await db.query.recipes.findFirst({
			where: eq(recipes.slug, params.slug),
			with: {
				versions: { orderBy: [desc(recipeVersions.versionNumber)], limit: 1 },
				recipesToTags: true
			}
		});

		if (!source) throw error(404, 'Source recipe not found');
		if (!source.isPublic && source.authorId !== user.id)
			throw error(404, 'Source recipe not found');

		const latestVersion = source.versions[0];
		if (!latestVersion) throw error(400, 'Source recipe has no versions');

		await ensureProfile(user);

		// One snapshot of the latest version is the whole content of the fork;
		// the source row contributes only its settings and lineage.
		const { title, description, servings, prepTimeMinutes, cookTimeMinutes, ingredients, steps } =
			latestVersion;
		const meta = { title, description, servings, prepTimeMinutes, cookTimeMinutes };
		const snapshot: RecipeContent = { ...meta, ingredients, steps };
		const slug = `${slugify(snapshot.title)}-${nanoid(6)}`;

		let newSlug: string | null = null;

		await db.transaction(async (tx) => {
			const [newRecipe] = await tx
				.insert(recipes)
				.values({
					authorId: user.id,
					slug,
					// Copies of version 1, per the ownership rule in schema.ts.
					...meta,
					imageUrl: source.imageUrl,
					isPublic: source.isPublic,
					parentId: source.id,
					forkedAt: new Date()
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
