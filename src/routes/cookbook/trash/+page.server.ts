import { redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { recipes } from '#lib/server/db/schema.js';
import {
	deleteForever,
	inTrashOf,
	purgeExpiredTrash,
	trashAge,
	trashedRecipe
} from '#lib/server/trash.js';
import { BAD_FORM, failure, requireUser, signedOut } from '#lib/server/actions.js';
import { text } from '#lib/helpers.js';
import { NOT_IN_TRASH } from '#lib/trash.js';
import type { Actions, PageServerLoad } from './$types';

// The owner's Trash: their deleted recipes still inside TRASH_DAYS, newest
// deletion first. Nobody else's recipes are ever read here.
export const load: PageServerLoad = async ({ url, locals: { user, supabase } }) => {
	requireUser(url, user);
	await purgeExpiredTrash(supabase);

	const rows = await db
		.select({ slug: recipes.slug, title: recipes.title, deletedAt: recipes.deletedAt })
		.from(recipes)
		.where(inTrashOf(user.id))
		.orderBy(desc(recipes.deletedAt));

	// Worded here, so the server and the hydrated page agree on "today".
	const now = new Date();
	return {
		// inTrashOf only matches rows with a deletion time.
		recipes: rows.map((r) => ({ slug: r.slug, title: r.title, ...trashAge(r.deletedAt!, now) })),
		meta: { title: 'Trash', noindex: true }
	};
};

/** The signed-in owner's trashed recipe the form names, or the failure to return. */
async function trashedFromForm(request: Request, userId: string) {
	const slug = text(await request.formData(), 'slug');
	if (!slug) return { failure: failure(400, 'invalid', BAD_FORM) };
	const recipe = await trashedRecipe(slug, userId);
	if (!recipe) return { failure: failure(404, 'not_found', NOT_IN_TRASH) };
	return { recipe };
}

export const actions: Actions = {
	// Everything comes back as it was: versions, tags, saves and forks' link
	// were never touched. Opens the recipe, which says it is back.
	restore: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const found = await trashedFromForm(request, user.id);
		if (!found.recipe) return found.failure;

		// Still in the Trash when written, so a purge that ran meanwhile wins.
		await db
			.update(recipes)
			.set({ deletedAt: null })
			.where(and(eq(recipes.id, found.recipe.id), inTrashOf(user.id)));
		throw redirect(303, `/recipes/${found.recipe.slug}`);
	},

	deleteForever: async ({ request, locals: { user, supabase } }) => {
		if (!user) return signedOut('delete again');
		const found = await trashedFromForm(request, user.id);
		if (!found.recipe) return found.failure;
		await deleteForever(found.recipe.id, supabase);
		return { deleted: found.recipe.title };
	}
};
