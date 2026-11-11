import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from './db/index.js';
import {
	logEntries,
	recipes,
	recipeVersions,
	LOG_AUDIENCES,
	type LogAudience,
	type LogEntry,
	type Recipe
} from './db/schema.js';
import { canView, friendIdsOf, inLibraryOf, viewableRecipe, type Viewer } from './visibility.js';
import { numberMessages, type Result } from '#lib/recipes/validation.js';
import { oneOf, text, wholeNumber } from '#lib/helpers.js';
import { day, MAX_LINK } from '#lib/journal.js';

export const MAX_DISH = 200;
export const MAX_ENTRY_TEXT = 2000;

/** What the Add to Journal form says, in the editor's voice. */
export const ENTRY_MESSAGES = {
	dishRequired: 'Dish is required',
	dishTooLong: `Dish is too long (${MAX_DISH} characters max)`,
	dateRequired: 'Date is required',
	dateInvalid: 'Date must be a real date',
	captionTooLong: `Caption is too long (${MAX_ENTRY_TEXT.toLocaleString('en-US')} characters max)`,
	noteTooLong: `Note is too long (${MAX_ENTRY_TEXT.toLocaleString('en-US')} characters max)`,
	recipeUnavailable: "That recipe isn't available. Choose another, or leave it out.",
	linkInvalid: 'Link must be a web address starting with http:// or https://',
	linkTooLong: `Link is too long (${MAX_LINK.toLocaleString('en-US')} characters max)`
} as const;

export type EntryFields = {
	dish: string;
	cookedOn: string;
	servings: number | null;
	caption: string | null;
	note: string | null;
	audience: LogAudience;
	/** A recipe slug, KEEP_SOURCE, or null for none. */
	recipe: string | null;
	version: number | null;
	/** An http(s) page the dish came from; null when a recipe is the source. */
	sourceUrl: string | null;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isRealDay(value: string): boolean {
	if (!ISO_DAY.test(value)) return false;
	const date = day(value);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** The form's fields, checked; or the first message to show. */
export function parseEntryForm(formData: FormData): Result<EntryFields> {
	const dish = text(formData, 'dish').trim();
	if (!dish) return { ok: false, error: ENTRY_MESSAGES.dishRequired };
	if (dish.length > MAX_DISH) return { ok: false, error: ENTRY_MESSAGES.dishTooLong };

	const cookedOn = text(formData, 'cookedOn').trim();
	if (!cookedOn) return { ok: false, error: ENTRY_MESSAGES.dateRequired };
	if (!isRealDay(cookedOn)) return { ok: false, error: ENTRY_MESSAGES.dateInvalid };

	const servingsText = text(formData, 'servings').trim();
	let servings: number | null = null;
	if (servingsText) {
		const messages = numberMessages('servings');
		servings = wholeNumber(servingsText);
		if (servings === null) return { ok: false, error: messages.whole };
		if (servings < 1) return { ok: false, error: messages.belowMin };
		if (servings > 10_000) return { ok: false, error: messages.tooLarge };
	}

	const caption = text(formData, 'caption').trim();
	if (caption.length > MAX_ENTRY_TEXT) return { ok: false, error: ENTRY_MESSAGES.captionTooLong };
	const note = text(formData, 'note').trim();
	if (note.length > MAX_ENTRY_TEXT) return { ok: false, error: ENTRY_MESSAGES.noteTooLong };

	const audienceText = text(formData, 'audience');
	const audience = oneOf(LOG_AUDIENCES, audienceText) ?? 'private';

	const recipe = text(formData, 'recipe').trim() || null;
	const versionText = text(formData, 'version').trim();
	const version = recipe ? wholeNumber(versionText) : null;

	const link = text(formData, 'link').trim();
	if (link.length > MAX_LINK) return { ok: false, error: ENTRY_MESSAGES.linkTooLong };
	if (link && !isWebUrl(link)) return { ok: false, error: ENTRY_MESSAGES.linkInvalid };

	return {
		ok: true,
		value: {
			dish,
			cookedOn,
			servings,
			caption: caption || null,
			note: note || null,
			audience,
			recipe,
			version,
			// A recipe is the source when one is attached; the link stands in for none.
			sourceUrl: recipe ? null : link || null
		}
	};
}

function isWebUrl(value: string): boolean {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

export type LinkedRecipe = {
	recipeId: number;
	versionId: number;
	slug: string;
	title: string;
	versionNumber: number;
	visibility: Recipe['visibility'];
};

/**
 * The recipe and version a form names, when the viewer may see it. A missing
 * version number means the latest; a number the recipe does not have is refused.
 */
export async function resolveRecipe(
	viewer: NonNullable<Viewer>,
	slug: string,
	versionNumber: number | null
): Promise<LinkedRecipe | null> {
	const recipe = await viewableRecipe(slug, viewer, {
		versions: { orderBy: [desc(recipeVersions.versionNumber)] }
	});
	if (!recipe) return null;
	const version =
		versionNumber === null
			? recipe.versions[0]
			: recipe.versions.find((v) => v.versionNumber === versionNumber);
	if (!version) return null;
	return {
		recipeId: recipe.id,
		versionId: version.id,
		slug: recipe.slug,
		title: recipe.title,
		versionNumber: version.versionNumber,
		visibility: recipe.visibility
	};
}

/** What a log entry says it was cooked from, for one viewer. */
export type EntrySource =
	| { kind: 'improvised' }
	/** No recipe, but a page it came from, shown by its host. */
	| { kind: 'link'; url: string; host: string }
	| { kind: 'deleted' }
	/** The recipe exists but the viewer may no longer see it (an unfriend, a narrowing). */
	| { kind: 'hidden' }
	| {
			kind: 'recipe';
			slug: string;
			title: string;
			versionNumber: number | null;
			visibility: Recipe['visibility'];
			own: boolean;
	  };

export type SourceRow = {
	recipeId: number | null;
	recipe: Pick<Recipe, 'slug' | 'title' | 'visibility' | 'authorId' | 'deletedAt'> | null;
	versionNumber: number | null;
	sourceUrl: string | null;
};

/** The source an entry shows `viewer`, by the recipes' one access rule. */
export function sourceOf(
	row: SourceRow,
	viewer: NonNullable<Viewer>,
	friendIds: string[]
): EntrySource {
	if (row.recipeId === null) {
		if (row.sourceUrl === null) return { kind: 'improvised' };
		const host = new URL(row.sourceUrl).hostname.replace(/^www\./, '');
		return { kind: 'link', url: row.sourceUrl, host };
	}
	// A recipe in the Trash reads as deleted, its owner's entries included.
	if (!row.recipe || row.recipe.deletedAt) return { kind: 'deleted' };
	if (!canView(row.recipe, viewer, friendIds)) return { kind: 'hidden' };
	return {
		kind: 'recipe',
		slug: row.recipe.slug,
		title: row.recipe.title,
		versionNumber: row.versionNumber,
		visibility: row.recipe.visibility,
		own: row.recipe.authorId === viewer.id
	};
}

/** A Friends entry is seen by the owner's accepted friends; a private one by the owner alone. */
export function canSeeEntry(
	entry: Pick<LogEntry, 'userId' | 'audience'>,
	viewer: Viewer,
	friendIds: string[]
): boolean {
	if (!viewer) return false;
	if (entry.userId === viewer.id) return true;
	return entry.audience === 'friends' && friendIds.includes(entry.userId);
}

/** The columns an entry's source is read from, for a select that joins recipes and versions. */
export const sourceColumns = {
	recipe: {
		slug: recipes.slug,
		title: recipes.title,
		visibility: recipes.visibility,
		authorId: recipes.authorId,
		deletedAt: recipes.deletedAt
	},
	versionNumber: recipeVersions.versionNumber
};

/** The viewer's own entries matching `where`, newest cooked first, each with its source. */
async function ownEntries(viewer: NonNullable<Viewer>, where?: SQL) {
	const [rows, friendIds] = await Promise.all([
		db
			.select({ entry: logEntries, ...sourceColumns })
			.from(logEntries)
			.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
			.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
			.where(and(eq(logEntries.userId, viewer.id), where))
			.orderBy(desc(logEntries.cookedOn), desc(logEntries.createdAt)),
		friendIdsOf(viewer.id)
	]);
	return rows.map((row) => ({
		...row.entry,
		source: sourceOf(
			{ ...row, recipeId: row.entry.recipeId, sourceUrl: row.entry.sourceUrl },
			viewer,
			friendIds
		)
	}));
}

/** Everything in someone's own Journal, newest cooked first, each with its source. */
export function journalOf(viewer: NonNullable<Viewer>) {
	return ownEntries(viewer);
}

/** One of the viewer's own entries with its source, or null when it is not theirs. */
export async function ownEntry(viewer: NonNullable<Viewer>, id: number) {
	const [entry] = await ownEntries(viewer, eq(logEntries.id, id));
	return entry ?? null;
}

/** The viewer's most recent entry for a recipe, for the recipe page's personal line. */
export async function lastEntryFor(userId: string, recipeId: number) {
	const [row] = await db
		.select({ id: logEntries.id, cookedOn: logEntries.cookedOn })
		.from(logEntries)
		.where(and(eq(logEntries.userId, userId), eq(logEntries.recipeId, recipeId)))
		.orderBy(desc(logEntries.cookedOn), desc(logEntries.createdAt))
		.limit(1);
	return row ?? null;
}

/**
 * Only me until the first accepted friend; from then on the audience of the
 * viewer's latest entry, so the choice is remembered without storing it.
 */
export async function defaultAudience(userId: string): Promise<LogAudience> {
	const friendIds = await friendIdsOf(userId);
	if (friendIds.length === 0) return 'private';
	const [latest] = await db
		.select({ audience: logEntries.audience })
		.from(logEntries)
		.where(eq(logEntries.userId, userId))
		.orderBy(desc(logEntries.createdAt))
		.limit(1);
	return latest?.audience ?? 'private';
}

/** The recipes the form offers: the viewer's own and their saved ones, by title, each with its latest version. */
export async function recipeChoices(viewer: NonNullable<Viewer>) {
	return db
		.select({
			slug: recipes.slug,
			title: recipes.title,
			visibility: recipes.visibility,
			latestVersion: sql<
				number | null
			>`(SELECT max(${recipeVersions.versionNumber}) FROM ${recipeVersions} WHERE ${recipeVersions.recipeId} = ${recipes.id})`.mapWith(
				(max: string | number | null) => (max === null ? null : Number(max))
			)
		})
		.from(recipes)
		.where(inLibraryOf(viewer))
		.orderBy(asc(recipes.title));
}
