import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions, recipesToTags, favorites } from '#lib/server/db/schema.js';
import { NOTE_MAX, NOTE_TOO_LONG } from '#lib/saves.js';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { recipeSlug, wholeNumber, text } from '#lib/helpers.js';
import { ensureProfile } from '#lib/server/profiles.js';
import { recipeCopies, versionContent } from '#lib/recipes/content.js';
import { recipeMeta } from '#lib/seo.js';
import { gramsFor } from '#lib/server/ingredientDensities.js';
import {
	canViewRow,
	friendIdsOnce,
	keptCopy,
	NOT_AUTHORIZED,
	ownRecipe,
	viewableRecipe
} from '#lib/server/visibility.js';
import { attachRecipeCounts } from '#lib/server/recipeCounts.js';
import { lastEntryFor } from '#lib/server/journal.js';
import { VERSION_NOT_FOUND } from './versionError.js';
import { BAD_FORM, failure, requireUser, signedOut } from '#lib/server/actions.js';
import { STALE_MESSAGE } from '#lib/server/submission.js';
import { restoreVersion } from '#lib/server/versions.js';
import { keepVersion, removeCopy, setNote } from '#lib/server/keptCopies.js';
import { deleteForever } from '#lib/server/trash.js';
import {
	collectionsOf,
	createCollection,
	leaveCollections,
	setMembership
} from '#lib/server/collections.js';
import { isModerator } from '#lib/server/moderation.js';
import { HIDDEN_REFUSED } from '#lib/moderation.js';
import type { PageServerLoad, Actions } from './$types';

/** A collection gone meanwhile, or a recipe no longer in the reader's library. */
const NOT_IN_COLLECTIONS =
	'That collection or recipe is no longer in your Cookbook. Reload the page.';

export const load: PageServerLoad = async ({ params, url, locals: { user } }) => {
	const recipeSlug = params.slug;
	const versionParam = url.searchParams.get('version');
	const requestedVersion = versionParam ? wholeNumber(versionParam) : null;
	if (versionParam && requestedVersion === null) throw error(404, VERSION_NOT_FOUND);

	// One friends lookup serves both access checks below.
	const friends = friendIdsOnce(user);
	const shown = await viewableRecipe(
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
	// Not visible: a saver may still keep a read-only copy of it, the one
	// version they kept, with no tags (tags follow the recipe's visibility).
	const copy = shown
		? null
		: await keptCopy(recipeSlug, user, {
				author: true,
				parent: { with: { author: true } }
			});
	if (!shown && !copy) throw error(404, 'Recipe not found');
	// The row may hold what the author wrote after withdrawing it, so a copy
	// takes only its identity and lineage from the row, never a spread of it,
	// and its words from the kept version. Its revision and audience are not the
	// saver's to see: a copy has no Restore (the version bar's revision is a
	// placeholder) and no audience line.
	const recipe = shown ?? {
		id: copy!.recipe.id,
		slug: copy!.recipe.slug,
		authorId: copy!.recipe.authorId,
		author: copy!.recipe.author,
		parentId: copy!.recipe.parentId,
		parentVersion: copy!.recipe.parentVersion,
		parent: copy!.recipe.parent,
		editRevision: 0,
		...recipeCopies(versionContent(copy!.version)),
		recipesToTags: [],
		versions: [{ ...copy!.version, creator: null }]
	};

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

	// Resolve which version's content to display: ?version= when asked, else
	// the version the saver keeps, else the latest. Creation and forking write
	// a version in the same transaction as the recipe, so every recipe has one.
	const latestVersion = recipe.versions[0];
	const keptVersion = copy ? null : (favorite?.keptVersion ?? null);
	const arrival = requestedVersion ?? keptVersion;
	const currentVersion =
		arrival === null ? latestVersion : recipe.versions.find((v) => v.versionNumber === arrival);
	if (!currentVersion) throw error(404, VERSION_NOT_FOUND);

	// Add to collection is for a recipe in the reader's library: their own, or saved.
	const collections =
		user && (recipe.authorId === user.id || isFavorited)
			? await collectionsOf(user, recipe.id)
			: null;

	return {
		recipe: visibleRecipe,
		currentVersion,
		// A copy shows no counts: it is the saver's, no longer the author's recipe.
		forkCount: copy ? 0 : forkCount,
		favoriteCount: copy ? 0 : favoriteCount,
		// Weights come from local tables at load time, so the page never pays for
		// an external lookup; lines the tables do not know get null.
		grams: currentVersion.ingredients.map(gramsFor),
		allVersions: recipe.versions,
		isFavorited,
		collections,
		/** The reader's own save: the version they keep and their note; null when not saved. */
		save: favorite ? { keptVersion, note: favorite.note } : null,
		/** A read-only copy of a recipe its author withdrew, for this saver alone. */
		keptCopy: !!copy,
		/** Hidden from other cooks by a moderator: only its author and moderators load it. */
		hidden: !!shown?.suppressedAt,
		/** The reader may hide or restore it. */
		moderator: isModerator(user),
		/** Signed in: the personal line's data; signed out there is no line. */
		journal: user
			? {
					lastEntry,
					// Add to Journal prefills the version being read.
					addHref: `/journal/new?recipe=${encodeURIComponent(recipe.slug)}&version=${currentVersion.versionNumber}`
				}
			: null,
		// Judged as a signed-out visitor would see it, whoever loaded the page.
		meta: recipeMeta({
			origin: url.origin,
			slug: recipe.slug,
			isPublic: shown?.visibility === 'public' && !shown.suppressedAt,
			latest: currentVersion === latestVersion,
			author: recipe.author?.username ?? null,
			tags: recipe.recipesToTags.map((rt) => rt.tag.name),
			parentSlug:
				visibleRecipe.parent?.visibility === 'public' && !visibleRecipe.parentDeleted
					? visibleRecipe.parent.slug
					: null,
			parentVersion: recipe.parentVersion,
			published: recipe.versions.at(-1)!.createdAt,
			version: currentVersion
		})
	};
};

/** What a keep or follow that no longer applies is told. */
const KEEP_REFUSED = 'Could not change the version you keep. Reload the page.';

/** The recipe at `slug` the reader may see, or their kept copy of it; a 404 otherwise. */
async function libraryRecipe(slug: string, user: { id: string }) {
	const recipe = (await viewableRecipe(slug, user)) ?? (await keptCopy(slug, user))?.recipe;
	if (!recipe) throw error(404, 'Recipe not found');
	return recipe;
}

export const actions: Actions = {
	toggleFavorite: async ({ params, locals: { user } }) => {
		if (!user) return signedOut();

		const recipe = await viewableRecipe(params.slug, user);
		if (!recipe) throw error(404, 'Recipe not found');

		// Unfavorite if it was a favorite; otherwise nothing was deleted, so favorite it.
		const removed = await db
			.delete(favorites)
			.where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipe.id)))
			.returning({ recipeId: favorites.recipeId });
		if (removed.length === 0) {
			if (recipe.suppressedAt) return failure(400, 'invalid', HIDDEN_REFUSED);
			// A second save of the same recipe (another tab, a double press) is the same save.
			await db
				.insert(favorites)
				.values({ userId: user.id, recipeId: recipe.id })
				.onConflictDoNothing();
		} else {
			// Out of the saver's collections too, so saving again starts clean.
			await leaveCollections(user.id, recipe.id);
		}
	},

	// Puts the recipe in one of the reader's collections (member=1) or takes it
	// out (member=0). setMembership checks the collection is theirs and, to add,
	// that the recipe is in their library.
	collect: async ({ params, request, locals: { user } }) => {
		if (!user) return signedOut();
		const form = await request.formData();
		const collectionId = wholeNumber(text(form, 'collectionId'));
		const member = text(form, 'member');
		if (collectionId === null || (member !== '1' && member !== '0'))
			return failure(400, 'invalid', BAD_FORM);

		const recipe = await libraryRecipe(params.slug, user);
		if (!(await setMembership(user, collectionId, recipe.id, member === '1')))
			return failure(404, 'not_found', NOT_IN_COLLECTIONS);
		return { collected: collectionId };
	},

	// A new collection named in the menu, with this recipe already in it.
	newCollection: async ({ params, request, locals: { user } }) => {
		if (!user) return signedOut();
		const name = text(await request.formData(), 'name');
		const recipe = await libraryRecipe(params.slug, user);
		const created = await createCollection(user.id, name);
		if ('error' in created) return failure(400, 'invalid', created.error, { name });
		if (!(await setMembership(user, created.id, recipe.id, true)))
			return failure(404, 'not_found', NOT_IN_COLLECTIONS);
		return { collected: created.id };
	},

	// Keep this version: the saver opens the recipe at `version` from now on.
	// Never the author's, who has Restore; never a copy, which keeps its own.
	keep: async ({ params, request, locals: { user } }) => {
		if (!user) return signedOut();
		const version = wholeNumber(text(await request.formData(), 'version'));
		if (version === null) return failure(400, 'invalid', BAD_FORM);
		const recipe = await viewableRecipe(params.slug, user);
		if (!recipe) throw error(404, 'Recipe not found');
		if (recipe.authorId === user.id || !(await keepVersion(user.id, recipe.id, version)))
			return failure(404, 'not_found', KEEP_REFUSED);
		return { kept: version };
	},

	// Follow latest version: the save stops keeping one.
	follow: async ({ params, locals: { user } }) => {
		if (!user) return signedOut();
		const recipe = await viewableRecipe(params.slug, user);
		if (!recipe) throw error(404, 'Recipe not found');
		if (!(await keepVersion(user.id, recipe.id, null)))
			return failure(404, 'not_found', KEEP_REFUSED);
		return { kept: null };
	},

	// The saver's private note, on a saved recipe or their kept copy of one.
	note: async ({ params, request, locals: { user } }) => {
		if (!user) return signedOut('save again');
		const note = text(await request.formData(), 'note');
		if (note.trim().length > NOTE_MAX) return failure(400, 'invalid', NOTE_TOO_LONG, { note });
		const recipe = await libraryRecipe(params.slug, user);
		if (!(await setNote(user.id, recipe.id, note)))
			return failure(404, 'not_found', 'Save the recipe to keep a note on it.', { note });
		return { noted: true };
	},

	// The saver removes their copy of a recipe its author withdrew: the save,
	// its note and its collection places go. An erased recipe's last copy
	// takes the rest of it with it (deleteForever).
	removeCopy: async ({ params, locals: { user, supabase } }) => {
		if (!user) return signedOut();
		const copy = await keptCopy(params.slug, user);
		if (!copy) throw error(404, 'Recipe not found');
		if (await removeCopy(user.id, copy.recipe.id)) await deleteForever(copy.recipe.id, supabase);
		throw redirect(303, '/cookbook?filter=saved');
	},

	// Copies the version being read (the form's `version`; the latest when the
	// form has none, as the Journal's Fork sends) and records which one it was.
	fork: async ({ params, request, locals: { user } }) => {
		if (!user) return signedOut();
		const versionField = text(await request.formData(), 'version');
		const version = versionField ? wholeNumber(versionField) : null;
		if (versionField && version === null) return failure(400, 'invalid', BAD_FORM);

		const source = await viewableRecipe(params.slug, user, {
			versions: {
				where: version === null ? undefined : eq(recipeVersions.versionNumber, version),
				orderBy: [desc(recipeVersions.versionNumber)],
				limit: 1
			},
			recipesToTags: true,
			author: true
		});
		if (!source) throw error(404, 'Source recipe not found');
		// For its author and moderators too: a fork would be a copy nobody hid.
		if (source.suppressedAt) return failure(400, 'invalid', HIDDEN_REFUSED);

		const copied = source.versions[0];
		if (!copied) return failure(404, 'not_found', `This recipe has no v${version}.`);

		// Forking is one click. The first version says where the copy came from;
		// the forker writes a message of their own when they change something.
		const from = source.author ? `@${source.author.username}, ` : '';
		const commitMessage = `Forked from ${from}v${copied.versionNumber}`;

		await ensureProfile(user);

		// One snapshot of the copied version is the whole content of the fork;
		// the source row contributes only its settings and lineage.
		const snapshot = versionContent(copied);
		const copies = recipeCopies(snapshot);
		const slug = recipeSlug(snapshot.title);

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
					parentId: source.id,
					parentVersion: copied.versionNumber
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
	},

	// Brings an older version back by appending it as the newest; no version
	// changes. Only the owner, and only from a page loaded at the current
	// revision, as an edit save is.
	restore: async ({ params, request, url, locals: { user } }) => {
		requireUser(url, user);
		const recipe = await ownRecipe(params.slug, user.id);

		const formData = await request.formData();
		const versionNumber = wholeNumber(text(formData, 'version'));
		const editRevision = wholeNumber(text(formData, 'editRevision'));
		if (versionNumber === null || editRevision === null) return failure(400, 'invalid', BAD_FORM);
		if (recipe.editRevision !== editRevision) return failure(409, 'stale', STALE_MESSAGE);

		const outcome = await db.transaction((tx) =>
			restoreVersion(tx, recipe.id, user.id, editRevision, versionNumber)
		);
		if (outcome === 'forbidden') throw error(403, NOT_AUTHORIZED);
		if (outcome === 'stale') return failure(409, 'stale', STALE_MESSAGE);
		if (outcome === 'not_found')
			return failure(404, 'not_found', `This recipe has no v${versionNumber}.`);
		if (outcome === 'unchanged')
			return failure(
				400,
				'invalid',
				`v${versionNumber} is the same as the latest version: nothing to restore.`
			);
		throw redirect(303, `/recipes/${params.slug}`);
	},

	// A moderator hides the recipe from other cooks, or restores it. Any live
	// recipe at the slug, one the moderator could not open included (a reported
	// Friends recipe); anyone else is told what a missing recipe tells them.
	hide: ({ params, locals: { user } }) => setHidden(params.slug, user, true),
	unhide: ({ params, locals: { user } }) => setHidden(params.slug, user, false)
};

async function setHidden(slug: string, user: App.Locals['user'], hidden: boolean) {
	if (!user) return signedOut();
	if (!isModerator(user)) return failure(404, 'not_found', 'Recipe not found');
	const recipe = await db.query.recipes.findFirst({
		where: and(eq(recipes.slug, slug), isNull(recipes.deletedAt)),
		columns: { id: true }
	});
	if (!recipe) return failure(404, 'not_found', 'Recipe not found');
	// Not a save: the author's revision and the lists' order stay as they are.
	// Hiding one already hidden keeps the time it was first hidden.
	await db
		.update(recipes)
		.set({ suppressedAt: hidden ? new Date() : null })
		.where(
			hidden
				? and(eq(recipes.id, recipe.id), isNull(recipes.suppressedAt))
				: eq(recipes.id, recipe.id)
		);
	return { hidden };
}
