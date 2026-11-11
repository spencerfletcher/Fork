import { inArray, sql, type SQL } from 'drizzle-orm';
import type { db, Tx } from './db/index.js';
import { recipes } from './db/schema.js';
import { MARK_END, MARK_START, type SearchMatch } from '#lib/highlight.js';

/** The `?q=` and `?tags=` filters shared by Search, Cookbook and Discover. */
export function parseFilters(url: URL): { searchQuery: string; tagSlugs: string[] } {
	return {
		searchQuery: url.searchParams.get('q')?.trim() || '',
		tagSlugs: url.searchParams.get('tags')?.split(',').filter(Boolean) || []
	};
}

// The SQL below names recipe_versions by string, never by its drizzle columns:
// db.query.findMany rebinds every column in its where and orderBy to the root
// alias ("recipes"), which would turn recipe_versions.recipe_id into
// "recipes"."recipe_id". Only recipes' own columns are interpolated.

/** A version row's notes, the labelled ones too, as one text, for the version aliased `v`. */
const notesOf = (v: string) =>
	`concat_ws(' ', ${v}.notes, ${v}.make_ahead, ${v}.equipment, ${v}.storage, ${v}.reheating)`;

// Both read through functions (drizzle/0019_search-functions.sql) so the GIN
// indexes on recipe_versions serve them: the call must stay the indexed one.

/** A version's ingredient names as a tsvector, for the version aliased `v`. */
const names = (v: string) =>
	sql.raw(`to_tsvector('english', recipe_ingredient_names(${v}.ingredients))`);

/** Everything a version says: title, description, source, ingredient names, steps and notes. */
const doc = (v: string) =>
	sql.raw(
		`recipe_version_doc(${v}.title, ${v}.description, ${v}.source_name, ${v}.ingredients, ${v}.steps, ` +
			`${v}.notes, ${v}.make_ahead, ${v}.equipment, ${v}.storage, ${v}.reheating)`
	);

// The outer recipe's id, qualified by hand: a single-table select renders
// ${recipes.id} as a bare "id", which inside these subqueries would bind to
// recipe_versions.id. Both a select and findMany name the table "recipes".
const recipeId = sql.raw('"recipes"."id"');

/** The recipe's latest version, as a one-row subquery aliased `cur`. */
const latest = sql`(SELECT * FROM recipe_versions cv WHERE cv.recipe_id = ${recipeId} ORDER BY cv.version_number DESC LIMIT 1) cur`;

/**
 * Whether the recipe's latest version's `text` matches: its id looked up among
 * the versions the index finds (one hashed set per query, not a parse per row).
 */
const currentMatches = (text: (v: string) => SQL, tsQuery: SQL) =>
	sql`(SELECT cv.id FROM recipe_versions cv WHERE cv.recipe_id = ${recipeId} ORDER BY cv.version_number DESC LIMIT 1)
		IN (SELECT v.id FROM recipe_versions v WHERE ${text('v')} @@ ${tsQuery})`;

/**
 * Where a recipe matched, best first: 0 the exact title, 1 a title word or the
 * title's start, 2 an ingredient of the current version, 3 anything else the
 * current version says (description, method, notes, source), 4 only an older version. Null
 * when it matched nowhere.
 */
function tier(query: string, tsQuery: SQL): SQL {
	return sql`(CASE
		WHEN lower(${recipes.title}) = lower(${query}) THEN 0
		WHEN starts_with(lower(${recipes.title}), lower(${query}))
			OR to_tsvector('english', ${recipes.title}) @@ ${tsQuery} THEN 1
		WHEN ${currentMatches(names, tsQuery)} THEN 2
		WHEN ${currentMatches(doc, tsQuery)} THEN 3
		WHEN EXISTS (SELECT 1 FROM recipe_versions v WHERE v.recipe_id = ${recipeId} AND ${doc('v')} @@ ${tsQuery}) THEN 4
	END)`;
}

/**
 * A recipe matches the query on its title, or on anything any of its versions
 * says. Results rank by where they matched (`tier`), then by saves; cardList
 * breaks the rest by the newest change, as browse orders: popularity only
 * breaks ties. Without a query everything matches and nothing ranks.
 */
export function textSearch(query: string): { where: SQL | undefined; rank: SQL[] } {
	if (!query) return { where: undefined, rank: [] };
	const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
	const rank = tier(query, tsQuery);
	// The rows `rank` places, each arm one an index serves: the exact title is a
	// prefix of itself, and the current version's text is a version's text. Its
	// ingredient names stay an arm of their own: a negated word ("-milk")
	// elsewhere in the version would hide them.
	// ponytail: a quoted phrase makes the index recheck every candidate version,
	// recomputing recipe_version_doc; a stored tsvector column is the upgrade
	// if phrase searches get slow.
	const where = sql`(${recipeId} IN (SELECT t.id FROM recipes t
			WHERE starts_with(lower(t.title), lower(${query})) OR to_tsvector('english', t.title) @@ ${tsQuery})
		OR EXISTS (SELECT 1 FROM recipe_versions v WHERE v.recipe_id = ${recipeId} AND ${doc('v')} @@ ${tsQuery})
		OR ${currentMatches(names, tsQuery)})`;
	return {
		where,
		rank: [
			sql`${rank}`,
			sql`(SELECT count(*) FROM favorites f WHERE f.recipe_id = ${recipeId}) DESC`
		]
	};
}

/**
 * The query's words as a prefix OR query, for marking matched words: letters
 * and digits only, so to_tsquery never sees an operator. Null when no word is left.
 */
function anyWord(query: string): SQL | null {
	const words = query
		.split(/\s+/)
		.map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
		.filter((w) => w && w.toLowerCase() !== 'or');
	if (words.length === 0) return null;
	return sql`to_tsquery('english', ${words.map((w) => `${w}:*`).join(' | ')})`;
}

type Found = {
	version: number;
	title: string;
	ingredients: string[] | null;
	description: { text: string; cut: boolean } | null;
	step: { n: number; text: string; cut: boolean } | null;
	notes: { text: string; cut: boolean } | null;
	source: string | null;
};

/**
 * Why each of `ids` matched `query`: its title with the matched words marked
 * and, when the title does not show the match, a label and the marked words
 * where it did ("Ingredient", "fresh ginger"). Run on the results only.
 */
export async function searchMatches(
	query: string,
	ids: number[],
	conn: typeof db | Tx
): Promise<Map<number, SearchMatch>> {
	const any = anyWord(query);
	if (!any || ids.length === 0) return new Map();
	const all = `HighlightAll=true,StartSel=${MARK_START},StopSel=${MARK_END}`;
	const part = `MaxWords=14,MinWords=6,StartSel=${MARK_START},StopSel=${MARK_END}`;
	const marked = (text: SQL) => sql`ts_headline('english', ${text}, ${any}, ${all})`;
	// A fragment of a longer text; cut says it does not start where the text does.
	const fragment = (text: SQL) =>
		sql`json_build_object('text', ts_headline('english', ${text}, ${any}, ${part}),
			'cut', NOT starts_with(${text}, regexp_replace(ts_headline('english', ${text}, ${any}, ${part}), '[\\x01\\x02]', '', 'g')))`;
	const found = (v: string) => {
		const t = (col: string) => sql.raw(`${v}.${col}`);
		return sql`json_build_object(
			'version', ${t('version_number')},
			'title', ${marked(t('title'))},
			'ingredients', (SELECT json_agg(${marked(sql.raw(`i->>'name'`))})
				FROM jsonb_array_elements(${t('ingredients')}) i
				WHERE to_tsvector('english', i->>'name') @@ ${any}),
			'description', CASE WHEN to_tsvector('english', coalesce(${t('description')}, '')) @@ ${any}
				THEN ${fragment(t('description'))} END,
			'step', (SELECT jsonb_build_object('n', n) || (${fragment(sql.raw(`s->>'text'`))})::jsonb
				FROM jsonb_array_elements(${t('steps')}) WITH ORDINALITY AS steps(s, n)
				WHERE to_tsvector('english', s->>'text') @@ ${any}
				ORDER BY n LIMIT 1),
			'notes', CASE WHEN to_tsvector('english', ${sql.raw(notesOf(v))}) @@ ${any}
				THEN ${fragment(sql.raw(notesOf(v)))} END,
			'source', CASE WHEN to_tsvector('english', coalesce(${t('source_name')}, '')) @@ ${any}
				THEN ${marked(t('source_name'))} END
		)`;
	};
	const rows = await conn
		.select({
			id: recipes.id,
			tier: tier(query, sql`websearch_to_tsquery('english', ${query})`).mapWith(Number),
			title: sql<string>`ts_headline('english', ${recipes.title}, ${any}, ${all})`,
			current: sql<Found | null>`(SELECT ${found('cur')} FROM ${latest})`,
			older: sql<Found | null>`(SELECT ${found('v')} FROM recipe_versions v
				WHERE v.recipe_id = ${recipeId} AND ${doc('v')} @@ websearch_to_tsquery('english', ${query})
				ORDER BY v.version_number DESC LIMIT 1)`
		})
		.from(recipes)
		.where(inArray(recipes.id, ids));
	return new Map(rows.map((row) => [row.id, explain(row)]));
}

const ellipsis = ({ text, cut }: { text: string; cut: boolean }) => (cut ? `…${text}` : text);

/** Where a match is shown: the ingredient names, else the description, the step, the notes, the source. */
function where(found: Found): { label: string; text: string } | null {
	if (found.ingredients?.length) {
		return {
			label: found.ingredients.length > 1 ? 'Ingredients' : 'Ingredient',
			text: found.ingredients.join(', ')
		};
	}
	if (found.description) return { label: 'Description', text: ellipsis(found.description) };
	if (found.step) return { label: `Method, step ${found.step.n}`, text: ellipsis(found.step) };
	if (found.notes) return { label: 'Notes', text: ellipsis(found.notes) };
	if (found.source) return { label: 'Source', text: found.source };
	return null;
}

function explain(row: {
	tier: number | null;
	title: string;
	current: Found | null;
	older: Found | null;
}): SearchMatch {
	const { title } = row;
	if (row.tier === null || row.tier <= 1) return { title };
	if (row.tier === 4 && row.older) {
		const shown = where(row.older);
		return {
			title,
			label: `In an older version (v${row.older.version})`,
			text: shown?.text ?? row.older.title
		};
	}
	if (!row.current) return { title };
	// Tier 3 matched outside the ingredients, so they are the last place to point.
	const current = row.tier === 3 ? { ...row.current, ingredients: null } : row.current;
	const shown = where(current) ?? where(row.current);
	return shown ? { title, ...shown } : { title };
}
