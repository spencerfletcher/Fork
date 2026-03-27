import { redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { recipes, recipeVersions, tags, recipesToTags, profiles } from '$lib/server/db/schema';
import { slugify } from '$lib/helpers';
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
		const title = (formData.get('title') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || null;
		const servings = parseInt(formData.get('servings') as string) || null;
		const prepTimeMinutes = parseInt(formData.get('prepTimeMinutes') as string) || null;
		const cookTimeMinutes = parseInt(formData.get('cookTimeMinutes') as string) || null;
		const isPublic = formData.get('isPublic') === 'on';
		const selectedTagNames = formData.getAll('tags') as string[];
		const ingredientsRaw = formData.get('ingredients') as string;
		const stepsRaw = formData.get('steps') as string;

		if (!title) throw error(400, 'Title is required');

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

		let ingredients, steps;
		try {
			ingredients = JSON.parse(ingredientsRaw);
			steps = JSON.parse(stepsRaw);
		} catch {
			throw error(400, 'Invalid ingredient or step data');
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw error(400, 'At least one ingredient is required');
		}
		if (!Array.isArray(steps) || steps.length === 0) {
			throw error(400, 'At least one step is required');
		}

		steps = steps.map((s: { text: string }, i: number) => ({ step: i + 1, text: s.text }));

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
			if (selectedTagNames.length > 0) {
				await tx
					.insert(tags)
					.values(selectedTagNames.map((name) => ({ name, slug: slugify(name) })))
					.onConflictDoNothing();
				const relevantTags = await tx.query.tags.findMany({
					where: inArray(tags.name, selectedTagNames)
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
