// A cook's own data as one ForkExport (#lib/export/archive.ts): their recipes
// with every version, their collections, saves and Journal. Other cooks'
// recipes appear only as references (slug, link, title, handle) and only where
// the cook may see them now; a kept copy's content is the author's and stays out.
import { error, json } from '@sveltejs/kit';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import { collectionRecipes, collections, favorites, profiles, recipes } from './db/schema.js';
import { canView, friendIdsOf, inLibraryOf } from './visibility.js';
import { keptVersionsOf } from './keptCopies.js';
import { wholeJournalOf, type EntrySource } from './journal.js';
import { versionContent } from '#lib/recipes/content.js';
import { forkedFromLine } from '#lib/recipes/forkedFrom.js';
import { oneOf } from '#lib/helpers.js';
import { toMarkdown } from '#lib/export/markdown.js';
import type { FailureCode } from './actions.js';
import {
	EXPORT_FORMAT,
	EXPORT_FORMATS,
	EXPORT_VERSION,
	exportFilename,
	type ExportFormat,
	type ExportRecipe,
	type ForkExport,
	type JournalSource,
	type RecipeRef
} from '#lib/export/archive.js';

type Conn = Tx | typeof db;

/**
 * Everything `userId` owns, or with `recipeId` that one recipe of theirs
 * alone (the caller checks it is theirs). `origin` makes the links absolute.
 */
// ponytail: built in memory in one response; stream recipe by recipe if a library outgrows a few MB.
export async function exportFor(
	userId: string,
	origin: string,
	recipeId?: number,
	conn: Conn = db
): Promise<ForkExport> {
	const user = { id: userId };
	const recipeUrl = (slug: string) => `${origin}/recipes/${slug}`;
	const ref = (slug: string, title: string, author: string | null | undefined): RecipeRef => ({
		slug,
		url: recipeUrl(slug),
		title,
		author: author ?? null
	});

	const profile = await conn.query.profiles.findFirst({ where: eq(profiles.id, userId) });
	if (!profile) throw error(404, 'Profile not found');

	const [own, friendIds] = await Promise.all([
		conn.query.recipes.findMany({
			where: and(
				eq(recipes.authorId, userId),
				isNull(recipes.erasedAt),
				recipeId === undefined ? undefined : eq(recipes.id, recipeId)
			),
			with: {
				versions: { orderBy: (v, { asc }) => [asc(v.versionNumber)] },
				recipesToTags: { with: { tag: true } },
				parent: { with: { author: { columns: { username: true } } } }
			},
			orderBy: [asc(recipes.createdAt), asc(recipes.id)]
		}),
		friendIdsOf(userId, conn)
	]);

	const exported: ExportRecipe[] = own.map((r) => {
		const { parent } = r;
		let forkedFrom: ExportRecipe['forkedFrom'] = null;
		if (r.parentId !== null) {
			if (!parent || parent.erasedAt || parent.deletedAt) forkedFrom = 'deleted';
			else if (!canView(parent, user, friendIds)) forkedFrom = 'hidden';
			else
				forkedFrom = {
					...ref(parent.slug, parent.title, parent.author?.username),
					version: r.parentVersion
				};
		}
		return {
			slug: r.slug,
			url: recipeUrl(r.slug),
			audience: r.visibility,
			tags: r.recipesToTags.map((t) => t.tag.name).sort(),
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
			inTrashSince: r.deletedAt?.toISOString() ?? null,
			forkedFrom,
			versions: r.versions.map((v) => ({
				number: v.versionNumber,
				date: v.createdAt.toISOString(),
				// A fork's v1 stores no message: its line is read from forkedFrom.
				message:
					forkedFrom !== null && v.versionNumber === 1
						? forkedFromLine(
								typeof forkedFrom === 'string' ? forkedFrom : { author: forkedFrom.author },
								r.parentVersion
							)
						: v.commitMessage,
				content: versionContent(v)
			}))
		};
	});

	const base: Omit<ForkExport, 'scope' | 'collections' | 'saves' | 'journal'> = {
		format: EXPORT_FORMAT,
		version: EXPORT_VERSION,
		exportedAt: new Date().toISOString(),
		profile: {
			username: profile.username,
			url: `${origin}/users/${profile.username}`,
			avatarUrl: profile.avatarUrl,
			joinedAt: profile.createdAt.toISOString()
		},
		recipes: exported
	};
	if (recipeId !== undefined)
		return { ...base, scope: 'recipe', collections: [], saves: [], journal: [] };

	const recipeRef = {
		id: recipes.id,
		slug: recipes.slug,
		title: recipes.title,
		authorId: recipes.authorId,
		author: profiles.username
	};
	// Saves the cook may still see (or keeps a copy of), as the Cookbook lists them.
	const saved = await conn
		.select({ save: favorites, recipe: recipeRef })
		.from(favorites)
		.innerJoin(recipes, eq(recipes.id, favorites.recipeId))
		.leftJoin(profiles, eq(profiles.id, recipes.authorId))
		.where(and(eq(favorites.userId, userId), inLibraryOf(user)))
		.orderBy(asc(favorites.createdAt));
	// Members: the cook's own recipes (the Trash's too) and the rest of their library.
	const members = await conn
		.select({
			collectionId: collectionRecipes.collectionId,
			addedAt: collectionRecipes.addedAt,
			recipe: recipeRef
		})
		.from(collectionRecipes)
		.innerJoin(collections, eq(collections.id, collectionRecipes.collectionId))
		.innerJoin(recipes, eq(recipes.id, collectionRecipes.recipeId))
		.leftJoin(profiles, eq(profiles.id, recipes.authorId))
		.where(
			and(
				eq(collections.ownerId, userId),
				or(and(eq(recipes.authorId, userId), isNull(recipes.erasedAt)), inLibraryOf(user))
			)
		)
		.orderBy(asc(collectionRecipes.addedAt));
	const [shelves, journal, kept] = await Promise.all([
		conn.query.collections.findMany({
			where: eq(collections.ownerId, userId),
			orderBy: [asc(collections.createdAt), asc(collections.id)]
		}),
		wholeJournalOf(user, conn),
		keptVersionsOf(user, [...new Set([...saved, ...members].map((r) => r.recipe.id))], conn)
	]);
	// A kept copy is titled by the version kept, never the row's later edits.
	const refOf = (r: (typeof saved)[number]['recipe']) =>
		ref(r.slug, kept.get(r.id)?.title ?? r.title, r.author);

	return {
		...base,
		scope: 'library',
		collections: shelves.map((c) => ({
			name: c.name,
			createdAt: c.createdAt.toISOString(),
			recipes: members
				.filter((m) => m.collectionId === c.id)
				.map((m) => ({ ...refOf(m.recipe), addedAt: m.addedAt.toISOString() }))
		})),
		saves: saved
			.filter((s) => s.recipe.authorId !== userId)
			.map(({ save, recipe }) => ({
				...refOf(recipe),
				savedAt: save.createdAt.toISOString(),
				keptVersion: save.keptVersion,
				keptCopy: kept.has(recipe.id) ? save.copyVersion : null,
				note: save.note
			})),
		journal: journal.map((e) => ({
			cookedOn: e.cookedOn,
			dish: e.dish,
			source: journalSource(e.source, recipeUrl),
			servings: e.servings,
			caption: e.caption,
			note: e.note,
			photoUrl: e.photoUrl,
			audience: e.audience
		}))
	};
}

function journalSource(source: EntrySource, url: (slug: string) => string): JournalSource {
	if (source.kind === 'recipe') {
		const { slug, title, versionNumber } = source;
		return { kind: 'recipe', slug, url: url(slug), title, version: versionNumber };
	}
	if (source.kind === 'link') return { kind: 'link', url: source.url };
	return { kind: source.kind };
}

export const EXPORT_SIGNED_OUT = 'Log in to download your data.';
export const EXPORT_BAD_FORMAT = 'Ask for format=json or format=md.';

const refusal = (status: number, code: FailureCode, message: string) =>
	json({ error: message, code }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Who is downloading and in which format, or the refusal: 401 signed out, 400 for a format not offered. */
export function exportRequest(
	url: URL,
	user: { id: string } | null
): { user: { id: string }; format: ExportFormat } | Response {
	if (!user) return refusal(401, 'unauthenticated', EXPORT_SIGNED_OUT);
	const format = oneOf(EXPORT_FORMATS, url.searchParams.get('format'));
	if (!format) return refusal(400, 'invalid', EXPORT_BAD_FORMAT);
	return { user, format };
}

const CONTENT_TYPE: Record<ExportFormat, string> = {
	json: 'application/json; charset=utf-8',
	md: 'text/markdown; charset=utf-8'
};

/** The export as a download in `format`, never cached. */
export function exportResponse(ex: ForkExport, format: ExportFormat): Response {
	const body = format === 'json' ? JSON.stringify(ex, null, 2) : toMarkdown(ex);
	const name = exportFilename(ex, format);
	return new Response(body, {
		headers: {
			'Content-Type': CONTENT_TYPE[format],
			// A slug may hold any script's letters ("味噌"), which a header cannot:
			// an ASCII name for old clients, the real one encoded (RFC 6266).
			'Content-Disposition': `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
			'Cache-Control': 'no-store'
		}
	});
}
