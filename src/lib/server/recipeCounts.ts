import { db } from '#lib/server/db/index.js';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { and, count, desc, inArray, sql, type SQL } from 'drizzle-orm';
import { visibleTo, type Viewer } from './visibility.js';
import { cookedCounts, type Cooked } from './journal.js';
import { wholeNumber } from '#lib/helpers.js';

/** The relations a recipe card renders: its author's id and handle, nothing more. */
export const CARD_WITH = { author: { columns: { id: true, username: true } } } as const;

/**
 * Attach version and fork counts to a list of recipes.
 *
 * Two grouped aggregates for the whole list — never one query per recipe. The
 * fork aggregate counts only forks `viewer` may see (visibleTo), so a fork they
 * cannot open never inflates a count; signed out that is public forks only.
 */
export async function attachRecipeCounts<T extends { id: number }>(
	recipeList: T[],
	viewer: Viewer = null
): Promise<(T & { versionCount: number; forkCount: number })[]> {
	const ids = recipeList.map((r) => r.id);

	if (ids.length === 0) {
		return [];
	}

	// recipe_versions is append-only — a row per edit, forever — so this
	// aggregate must never full-scan it. Scoped to the recipes actually passed in.
	const versionCounts = await db
		.select({ recipeId: recipeVersions.recipeId, count: count() })
		.from(recipeVersions)
		.where(inArray(recipeVersions.recipeId, ids))
		.groupBy(recipeVersions.recipeId);

	const forkCounts = await db
		.select({ parentId: recipes.parentId, count: count() })
		.from(recipes)
		.where(and(inArray(recipes.parentId, ids), visibleTo(viewer)))
		.groupBy(recipes.parentId);

	const versionsById = new Map(versionCounts.map((r) => [r.recipeId, Number(r.count)]));
	const forksById = new Map(forkCounts.map((r) => [r.parentId, Number(r.count)]));

	return recipeList.map((r) => ({
		...r,
		versionCount: versionsById.get(r.id) ?? 0,
		forkCount: forksById.get(r.id) ?? 0
	}));
}

/** A browse cursor: the last card's change time, to the microsecond as Postgres prints it, and its id. */
const KEYSET = /^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d{1,6})?)~(\d+)$/;

/**
 * One page of the recipe cards matching `where`, each with its counts for
 * `viewer`, and the cursor of the page after it (null at the end). The order
 * is `rank` (a text query's), then the newest change, then the higher id, so
 * no two cards tie. Without a rank the cursor is a keyset on (updated_at, id):
 * a card changed between pages neither repeats nor shifts the rest. A rank is
 * computed per query, so a ranked cursor is a position instead. A cursor that
 * is not one reads as the first page. With `cooked` (the viewer's own shelf
 * only, never a list about the recipe) a card the viewer has logged also
 * carries their times and last cooked.
 */
export async function cardList(
	where: SQL | undefined,
	rank: SQL[],
	viewer: Viewer,
	{ after, limit, cooked }: { after: string | null; limit: number; cooked?: boolean }
) {
	const ranked = rank.length > 0;
	// A ranked cursor is how many cards came before.
	const offset = ranked ? (wholeNumber(after ?? '') ?? 0) : 0;
	const key = ranked ? null : KEYSET.exec(after ?? '');
	// Postgres turns the row compare into a range on the live updated_at index.
	const afterKey = key
		? sql`(${recipes.updatedAt}, ${recipes.id}) < (${key[1]}::timestamp, ${Number(key[2])})`
		: undefined;
	const rows = await db.query.recipes.findMany({
		where: and(where, afterKey),
		// The search vector is the database's own, never a card's.
		columns: { fts: false },
		extras: { cursorAt: sql<string>`${recipes.updatedAt}::text`.as('cursor_at') },
		with: CARD_WITH,
		orderBy: [...rank, desc(recipes.updatedAt), desc(recipes.id)],
		// One more than the page says whether a page follows.
		limit: limit + 1,
		offset
	});
	const page = rows.slice(0, limit);
	const last = page.at(-1);
	const next =
		rows.length > limit && last
			? ranked
				? String(offset + limit)
				: `${last.cursorAt}~${last.id}`
			: null;
	// The cursor is the page's, never a card's.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const cards = page.map(({ cursorAt, ...card }) => card);
	const withCounts = await attachRecipeCounts(cards, viewer);
	const cookedById =
		cooked && viewer
			? await cookedCounts(
					viewer.id,
					cards.map((r) => r.id)
				)
			: new Map<number, Cooked>();
	return { cards: withCounts.map((r) => ({ ...r, ...cookedById.get(r.id) })), next };
}
