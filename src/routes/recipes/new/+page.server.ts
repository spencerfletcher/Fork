import { redirect, error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { parseRecipeMeta, parseRecipeContent } from '#lib/recipes/validation.js';
import { recipes, recipeVersions, tags, recipesToTags, profiles } from '#lib/server/db/schema.js';
import { slugify } from '#lib/helpers.js';
import { inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!user) throw redirect(303, '/login');

	const allTags = await db.query.tags.findMany({
		orderBy: (t, { asc }) => [asc(t.name)]
	});

	return { allTags };
};

export const actions: Actions = {
	default: async ({ request, locals: { user, supabase } }) => {
		if (!user) throw error(401, 'Login required');

		const formData = await request.formData();
		const meta = parseRecipeMeta(formData);
		if (!meta.ok) return fail(400, { error: meta.error });
		const content = parseRecipeContent(formData);
		if (!content.ok) return fail(400, { error: content.error });
		const { title, description, servings, prepTimeMinutes, cookTimeMinutes, isPublic, tagNames } =
			meta.value;
		const { ingredients, steps } = content.value;

		// Handle image upload to Supabase Storage
		let imageUrl: string | null = null;
		const imageFile = formData.get('image') as File | null;
		if (imageFile && imageFile.size > 0) {
			const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
			const filename = `${user.id}/${nanoid()}.${ext}`;
			const { error: uploadError } = await supabase.storage
				.from('recipe-images')
				.upload(filename, imageFile, { contentType: imageFile.type, upsert: false });
			if (!uploadError) {
				const {
					data: { publicUrl }
				} = supabase.storage.from('recipe-images').getPublicUrl(filename);
				imageUrl = publicUrl;
			}
			// If upload fails, imageUrl stays null — recipe is created without an image
		}

		// Upsert profile for creator
		await db
			.insert(profiles)
			.values({ id: user.id, username: user.email?.split('@')[0] ?? user.id })
			.onConflictDoNothing();

		const slug = `${slugify(title)}-${nanoid(6)}`;

		await db.transaction(async (tx) => {
			const [newRecipe] = await tx
				.insert(recipes)
				.values({
					slug,
					title,
					description,
					imageUrl,
					servings,
					prepTimeMinutes,
					cookTimeMinutes,
					isPublic,
					authorId: user.id
				})
				.returning({ id: recipes.id });

			// Sync tags
			if (tagNames.length > 0) {
				await tx
					.insert(tags)
					.values(tagNames.map((name) => ({ name, slug: slugify(name) })))
					.onConflictDoNothing();
				const relevantTags = await tx.query.tags.findMany({
					where: inArray(tags.name, tagNames)
				});
				if (relevantTags.length > 0) {
					await tx
						.insert(recipesToTags)
						.values(relevantTags.map((t) => ({ recipeId: newRecipe.id, tagId: t.id })));
				}
			}

			await tx.insert(recipeVersions).values({
				recipeId: newRecipe.id,
				versionNumber: 1,
				commitMessage: 'Initial recipe',
				ingredients,
				steps,
				createdBy: user.id
			});
		});

		throw redirect(303, `/recipes/${slug}`);
	}
};
