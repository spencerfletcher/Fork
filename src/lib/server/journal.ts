import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from './db/index.js';
import {
	favorites,
	logEntries,
	recipes,
	recipeVersions,
	LOG_AUDIENCES,
	type LogAudience,
	type LogEntry,
	type Recipe
} from './db/schema.js';
import { canView, canViewRow, friendIdsOf, visibleTo } from './visibility.js';
import { numberMessages, type Result } from '#lib/recipes/validation.js';
import { text } from '#lib/helpers.js';

type Viewer = { id: string };

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
	recipeUnavailable: "That recipe isn't available. Choose another, or leave it out."
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
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isRealDay(value: string): boolean {
	if (!ISO_DAY.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
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
		if (!/^\d+$/.test(servingsText)) return { ok: false, error: messages.whole };
		servings = Number(servingsText);
		if (servings < 1) return { ok: false, error: messages.belowMin };
		if (servings > 10_000) return { ok: false, error: messages.tooLarge };
	}

	const caption = text(formData, 'caption').trim();
	if (caption.length > MAX_ENTRY_TEXT) return { ok: false, error: ENTRY_MESSAGES.captionTooLong };
	const note = text(formData, 'note').trim();
	if (note.length > MAX_ENTRY_TEXT) return { ok: false, error: ENTRY_MESSAGES.noteTooLong };

	const audienceText = text(formData, 'audience');
	const audience = LOG_AUDIENCES.find((a) => a === audienceText) ?? 'private';

	const recipe = text(formData, 'recipe').trim() || null;
	const versionText = text(formData, 'version').trim();
	const version = recipe && /^\d+$/.test(versionText) ? Number(versionText) : null;

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
			version
		}
	};
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
	viewer: Viewer,
	slug: string,
	versionNumber: number | null
): Promise<LinkedRecipe | null> {
	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.slug, slug),
		with: { versions: { orderBy: [desc(recipeVersions.versionNumber)] } }
	});
	if (!recipe || !(await canViewRow(recipe, viewer))) return null;
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
	recipe: Pick<Recipe, 'slug' | 'title' | 'visibility' | 'authorId'> | null;
	versionNumber: number | null;
};

/** The source an entry shows `viewer`, by the recipes' one access rule. */
export function sourceOf(row: SourceRow, viewer: Viewer, friendIds: string[]): EntrySource {
	if (row.recipeId === null) return { kind: 'improvised' };
	if (!row.recipe) return { kind: 'deleted' };
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
	viewer: Viewer | null,
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
		authorId: recipes.authorId
	},
	versionNumber: recipeVersions.versionNumber
};

/** Everything in someone's own Journal, newest cooked first, each with its source. */
export async function journalOf(viewer: Viewer) {
	const [rows, friendIds] = await Promise.all([
		db
			.select({ entry: logEntries, ...sourceColumns })
			.from(logEntries)
			.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
			.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
			.where(eq(logEntries.userId, viewer.id))
			.orderBy(desc(logEntries.cookedOn), desc(logEntries.createdAt)),
		friendIdsOf(viewer.id)
	]);
	return rows.map((row) => ({
		...row.entry,
		source: sourceOf({ ...row, recipeId: row.entry.recipeId }, viewer, friendIds)
	}));
}

/** One of the viewer's own entries with its source, or null when it is not theirs. */
export async function ownEntry(viewer: Viewer, id: number) {
	const [rows, friendIds] = await Promise.all([
		db
			.select({ entry: logEntries, ...sourceColumns })
			.from(logEntries)
			.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
			.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
			.where(and(eq(logEntries.id, id), eq(logEntries.userId, viewer.id)))
			.limit(1),
		friendIdsOf(viewer.id)
	]);
	const row = rows[0];
	if (!row) return null;
	return {
		...row.entry,
		source: sourceOf({ ...row, recipeId: row.entry.recipeId }, viewer, friendIds)
	};
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

/** The recipes the form offers: the viewer's own and their saved ones, by title. */
export async function recipeChoices(viewer: Viewer) {
	const saved = db
		.select({ id: favorites.recipeId })
		.from(favorites)
		.where(eq(favorites.userId, viewer.id));
	return db
		.select({ slug: recipes.slug, title: recipes.title, visibility: recipes.visibility })
		.from(recipes)
		.where(and(or(eq(recipes.authorId, viewer.id), inArray(recipes.id, saved)), visibleTo(viewer)))
		.orderBy(asc(recipes.title));
}
