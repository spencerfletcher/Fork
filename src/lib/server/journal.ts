import {
	and,
	asc,
	count,
	countDistinct,
	desc,
	eq,
	inArray,
	isNotNull,
	max,
	sql,
	type SQL
} from 'drizzle-orm';
import { db, type Tx } from './db/index.js';
import {
	logEntries,
	recipes,
	recipeVersions,
	LOG_AUDIENCES,
	type LogAudience,
	type LogEntry,
	type Recipe
} from './db/schema.js';
import {
	canView,
	friendIdsOf,
	inLibraryOf,
	keptCopy,
	viewableRecipe,
	type Viewer
} from './visibility.js';
import { keptVersionsOf } from './keptCopies.js';
import { numberMessages, type Result } from '#lib/recipes/validation.js';
import { oneOf, text, wholeNumber } from '#lib/helpers.js';
import {
	day,
	ENTRY_MESSAGES,
	MAX_DISH,
	MAX_ENTRY_TEXT,
	MAX_LINK,
	MOST_COOKED,
	sourceHref,
	summaryMonths
} from '#lib/journal.js';

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
 * A saver's kept copy of a withdrawn recipe resolves to its one version, by
 * that version's title, and reads as private: nobody else can open it.
 */
export async function resolveRecipe(
	viewer: NonNullable<Viewer>,
	slug: string,
	versionNumber: number | null
): Promise<LinkedRecipe | null> {
	const recipe = await viewableRecipe(slug, viewer, {
		versions: { orderBy: [desc(recipeVersions.versionNumber)] }
	});
	if (!recipe) {
		const copy = await keptCopy(slug, viewer);
		if (!copy || (versionNumber !== null && versionNumber !== copy.version.versionNumber))
			return null;
		return {
			recipeId: copy.recipe.id,
			versionId: copy.version.id,
			slug: copy.recipe.slug,
			title: copy.version.title,
			versionNumber: copy.version.versionNumber,
			visibility: 'private'
		};
	}
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
	recipe: Pick<
		Recipe,
		'slug' | 'title' | 'visibility' | 'authorId' | 'deletedAt' | 'suppressedAt'
	> | null;
	versionNumber: number | null;
	sourceUrl: string | null;
};

/**
 * The source an entry shows `viewer`, by the recipes' one access rule. `kept`
 * holds the viewer's kept copies (keptVersionsOf), passed for their own
 * entries only: a copy links for its saver alone, by its kept title.
 */
export function sourceOf(
	row: SourceRow,
	viewer: NonNullable<Viewer>,
	friendIds: string[],
	kept?: Map<number, { title: string }>
): EntrySource {
	if (row.recipeId === null) {
		if (row.sourceUrl === null) return { kind: 'improvised' };
		const host = new URL(row.sourceUrl).hostname.replace(/^www\./, '');
		return { kind: 'link', url: row.sourceUrl, host };
	}
	const copy = kept?.get(row.recipeId);
	if (copy && row.recipe)
		return {
			kind: 'recipe',
			slug: row.recipe.slug,
			title: copy.title,
			versionNumber: row.versionNumber,
			visibility: 'private',
			own: false
		};
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
		deletedAt: recipes.deletedAt,
		suppressedAt: recipes.suppressedAt
	},
	versionNumber: recipeVersions.versionNumber
};

/**
 * The first `limit` (all of them without one) of the viewer's own entries matching `where`, newest
 * cooked first and then the later logged (the higher id), each with its source.
 */
async function ownEntries(
	viewer: NonNullable<Viewer>,
	where: SQL | undefined,
	limit?: number,
	conn: Tx | typeof db = db
) {
	const query = conn
		.select({ entry: logEntries, ...sourceColumns })
		.from(logEntries)
		.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
		.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
		.where(and(eq(logEntries.userId, viewer.id), where))
		.orderBy(desc(logEntries.cookedOn), desc(logEntries.id));
	const [rows, friendIds] = await Promise.all([
		limit === undefined ? query : query.limit(limit),
		friendIdsOf(viewer.id, conn)
	]);
	const kept = await keptVersionsOf(
		viewer,
		[...new Set(rows.flatMap((r) => r.entry.recipeId ?? []))],
		conn
	);
	return rows.map((row) => ({
		...row.entry,
		source: sourceOf(
			{ ...row, recipeId: row.entry.recipeId, sourceUrl: row.entry.sourceUrl },
			viewer,
			friendIds,
			kept
		)
	}));
}

/** Everything in someone's own Journal, newest cooked first, each with its source: the export's read. */
export function wholeJournalOf(viewer: NonNullable<Viewer>, conn: Tx | typeof db = db) {
	return ownEntries(viewer, undefined, undefined, conn);
}

/** Entries in one page of the Journal: about a month of dinners. */
export const ENTRIES_PER_PAGE = 30;

/** A Journal cursor: the last entry's cooked day and id. */
const ENTRY_KEY = /^(\d{4}-\d\d-\d\d)~(\d+)$/;

/**
 * One page of someone's own Journal, newest cooked first, each with its
 * source, and the cursor of the page after it (null at the end): a keyset on
 * (cooked_on, id), so an entry logged between pages shifts nothing. A cursor
 * that is not one reads as the first page.
 */
export async function journalOf(
	viewer: NonNullable<Viewer>,
	{ after, limit }: { after: string | null; limit: number }
) {
	const key = ENTRY_KEY.exec(after ?? '');
	const rows = await ownEntries(
		viewer,
		key
			? sql`(${logEntries.cookedOn}, ${logEntries.id}) < (${key[1]}::date, ${Number(key[2])})`
			: undefined,
		limit + 1
	);
	const entries = rows.slice(0, limit);
	const last = entries.at(-1);
	return {
		entries,
		next: rows.length > limit && last ? `${last.cookedOn}~${last.id}` : null
	};
}

/** How many entries someone's Journal holds, for the summary line. */
export async function journalSummary(userId: string) {
	const [row] = await db
		.select({ total: count() })
		.from(logEntries)
		.where(eq(logEntries.userId, userId));
	return row;
}

/**
 * The last SUMMARY_MONTHS calendar months on top of the Journal, the current
 * one last, ending with `today` (the cook's YYYY-MM-DD day, todayFor): each month's
 * count of the viewer's entries from the window's first day through today
 * (an entry dated after today is outside it), and the MOST_COOKED recipes
 * they logged most there, most first. A recipe the viewer may no longer open
 * (Trash, deleted, out of sight) still counts, by the dish its latest entry
 * names and no link, as sourceOf decides. `dishes` counts the different
 * dishes cooked there: each recipe once, and each recipe-less entry by its
 * dish, trimmed and in any case. Null when the window holds no entry. All
 * three reads walk log_entries_user_idx (user_id, cooked_on) over the window.
 */
export async function journalTwelveMonths(
	viewer: NonNullable<Viewer>,
	today: string,
	conn: Tx | typeof db = db
) {
	const months = summaryMonths(today);
	const inWindow = and(
		eq(logEntries.userId, viewer.id),
		sql`${logEntries.cookedOn} >= ${months[0]}::date`,
		sql`${logEntries.cookedOn} <= ${today}::date`
	);
	const month = sql<string>`to_char(${logEntries.cookedOn}, 'YYYY-MM-01')`;
	const times = count();
	const dish = sql`case when ${logEntries.recipeId} is not null then 'r' || ${logEntries.recipeId} else 'd' || lower(btrim(${logEntries.dish})) end`;
	const [perMonth, [{ dishes }], most, friendIds] = await Promise.all([
		conn.select({ month, cooks: count() }).from(logEntries).where(inWindow).groupBy(month),
		conn
			.select({ dishes: countDistinct(dish) })
			.from(logEntries)
			.where(inWindow),
		conn
			.select({
				recipeId: logEntries.recipeId,
				times,
				dish: sql<string>`(array_agg(${logEntries.dish} order by ${logEntries.cookedOn} desc, ${logEntries.id} desc))[1]`,
				recipe: sourceColumns.recipe
			})
			.from(logEntries)
			.leftJoin(recipes, eq(recipes.id, logEntries.recipeId))
			.where(and(inWindow, isNotNull(logEntries.recipeId)))
			.groupBy(logEntries.recipeId, recipes.id)
			.orderBy(desc(times), desc(max(logEntries.cookedOn)), desc(logEntries.recipeId))
			.limit(MOST_COOKED),
		friendIdsOf(viewer.id, conn)
	]);
	if (perMonth.length === 0) return null;
	const counts = new Map(perMonth.map((r) => [r.month, r.cooks]));
	const kept = await keptVersionsOf(
		viewer,
		most.map((r) => r.recipeId!),
		conn
	);
	return {
		months: months.map((m) => ({ month: m, cooks: counts.get(m) ?? 0 })),
		dishes,
		top: most.map((row) => {
			// No version number: the summary links the recipe, not one cook of it.
			const source = sourceOf(
				{ ...row, versionNumber: null, sourceUrl: null },
				viewer,
				friendIds,
				kept
			);
			return {
				recipeId: row.recipeId!,
				times: row.times,
				title: source.kind === 'recipe' ? source.title : row.dish,
				href: source.kind === 'recipe' ? sourceHref(source) : null
			};
		})
	};
}

/** One of the viewer's own entries with its source, or null when it is not theirs. */
export async function ownEntry(viewer: NonNullable<Viewer>, id: number) {
	const [entry] = await ownEntries(viewer, eq(logEntries.id, id), 1);
	return entry ?? null;
}

/**
 * The viewer's most recent entry for a recipe, for the recipe page's personal
 * line, with how many entries of it they have: the window count runs before
 * the limit, so one row carries the total.
 */
export async function lastEntryFor(userId: string, recipeId: number, tx: Tx | typeof db = db) {
	const [row] = await tx
		.select({
			id: logEntries.id,
			cookedOn: logEntries.cookedOn,
			timesCooked: sql<number>`count(*) over ()`.mapWith(Number)
		})
		.from(logEntries)
		.where(and(eq(logEntries.userId, userId), eq(logEntries.recipeId, recipeId)))
		.orderBy(desc(logEntries.cookedOn), desc(logEntries.createdAt))
		.limit(1);
	return row ?? null;
}

/**
 * The recipe page's recall line: the viewer's newest entry of a recipe that
 * carries a "Note for next time", with its day and the version cooked (null
 * when none was linked). Reads `userId`'s own entries alone, so the note,
 * private to its writer, can never show anyone else.
 */
export async function lastNoteFor(userId: string, recipeId: number, tx: Tx | typeof db = db) {
	const [row] = await tx
		.select({
			id: logEntries.id,
			cookedOn: logEntries.cookedOn,
			versionNumber: recipeVersions.versionNumber,
			note: sql<string>`${logEntries.note}`
		})
		.from(logEntries)
		.leftJoin(recipeVersions, eq(recipeVersions.id, logEntries.versionId))
		.where(
			and(
				eq(logEntries.userId, userId),
				eq(logEntries.recipeId, recipeId),
				isNotNull(logEntries.note)
			)
		)
		.orderBy(desc(logEntries.cookedOn), desc(logEntries.createdAt))
		.limit(1);
	return row ?? null;
}

export type Cooked = { timesCooked: number; lastCookedOn: string };

/**
 * cookedCounts' two facts as SQL on each `recipes` row, for ordering a card
 * list by them in the same read: how often `userId` cooked it (0 when never)
 * and their latest day (null when never). Raw names inside, because a
 * relational query renames every column to its root table; each reads the
 * cook's own entries of one recipe through log_entries_user_idx.
 * ponytail: each card reads all the cook's entries and keeps its own; 6-12 ms
 * at 300 recipes and 400 entries by EXPLAIN ANALYZE. A
 * (user_id, recipe_id) index is the upgrade when a Journal runs to thousands.
 */
export function cookedOrder(userId: string): { times: SQL<number>; last: SQL<string | null> } {
	const theirs = sql`le.user_id = ${userId} AND le.recipe_id = ${recipes.id}`;
	return {
		times: sql<number>`(SELECT count(*) FROM log_entries le WHERE ${theirs})`,
		last: sql<string | null>`(SELECT max(le.cooked_on) FROM log_entries le WHERE ${theirs})`
	};
}

/**
 * How often and when last the viewer cooked each of `recipeIds`, from their
 * own entries only: one grouped query for the whole list. A recipe they never
 * logged has no key. Derived on every read, never stored.
 */
export async function cookedCounts(
	userId: string,
	recipeIds: number[],
	tx: Tx | typeof db = db
): Promise<Map<number, Cooked>> {
	if (recipeIds.length === 0) return new Map();
	const rows = await tx
		.select({
			recipeId: logEntries.recipeId,
			timesCooked: count(),
			lastCookedOn: max(logEntries.cookedOn)
		})
		.from(logEntries)
		.where(and(eq(logEntries.userId, userId), inArray(logEntries.recipeId, recipeIds)))
		.groupBy(logEntries.recipeId);
	return new Map(
		rows.map((r) => [
			r.recipeId!,
			{ timesCooked: Number(r.timesCooked), lastCookedOn: r.lastCookedOn! }
		])
	);
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

/**
 * The recipes the form offers: the viewer's own and their saved ones, by title,
 * each with its latest version. A kept copy offers its kept version, by that
 * version's title, never the row's later private edits.
 */
export async function recipeChoices(viewer: NonNullable<Viewer>) {
	const rows = await db
		.select({
			id: recipes.id,
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
	const kept = await keptVersionsOf(
		viewer,
		rows.map((r) => r.id)
	);
	return rows.map(({ id, ...choice }) => {
		const copy = kept.get(id);
		return copy
			? {
					...choice,
					title: copy.title,
					visibility: 'private' as const,
					latestVersion: copy.versionNumber
				}
			: choice;
	});
}
