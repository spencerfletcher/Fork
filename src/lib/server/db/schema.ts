import type { Ingredient, Step } from '#lib/recipes/types.js';
import type { Visibility } from '#lib/recipes/validation.js';
import type { Measurement } from '#lib/measurement.js';
import { NOTE_MAX } from '#lib/saves.js';
import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	primaryKey,
	jsonb,
	customType,
	index,
	unique,
	check,
	date,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// tsvector is a native Postgres type not built into Drizzle
const tsvector = customType<{ data: string }>({
	dataType() {
		return 'tsvector';
	}
});
import type { InferSelectModel } from 'drizzle-orm';

// Every table enables row level security with no policies: the anon key ships
// to the browser, the app reaches Postgres only through Drizzle as the
// `postgres` role (BYPASSRLS), so RLS-with-no-policies closes PostgREST to the
// public while leaving the app untouched. A browser-side client would read
// nothing until policies are added here, which is the intended failure mode.
// ─── Profiles ────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
	id: text().primaryKey(), // Supabase auth user ID
	username: text().notNull().unique(),
	avatarUrl: text('avatar_url'),
	// The audience a new recipe starts at (Settings); private until changed.
	defaultVisibility: text('default_visibility').$type<Visibility>().notNull().default('private'),
	// Units quantities are shown in (Settings); null shows them as written.
	measurement: text().$type<Measurement>(),
	// When the starter collections were made; null until the cook first needs
	// one. Kept so a starter the cook deleted is never made again.
	startersMadeAt: timestamp('starters_made_at'),
	createdAt: timestamp('created_at').notNull().defaultNow()
}).enableRLS();

// A username a profile gave up. Old /users/<name> links redirect to the
// owner's current name, and the name stays reserved to that owner: nobody else
// may take it (so old links cannot be used to impersonate them), but the owner
// may take it back, which deletes the row. The key keeps one owner per name.
export const formerUsernames = pgTable(
	'former_usernames',
	{
		username: text().primaryKey(),
		profileId: text('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('former_usernames_profile_idx').on(table.profileId)]
).enableRLS();

// ─── Recipes ─────────────────────────────────────────────────────────────────

export const recipes = pgTable(
	'recipes',
	{
		id: serial().primaryKey(),
		authorId: text('author_id').references(() => profiles.id, { onDelete: 'set null' }),
		slug: text().notNull().unique(),
		// Copies of the latest version's content (title, description, photo,
		// servings, times), kept so search (the generated fts column) and list
		// cards can read recipes without a join. Written in the same transaction
		// as the version that defines them; never edited on their own.
		title: text().notNull(),
		description: text(),
		imageUrl: text('image_url'),
		servings: integer(),
		prepTimeMinutes: integer('prep_time_minutes'),
		cookTimeMinutes: integer('cook_time_minutes'),
		// Fork lineage
		parentId: integer('parent_id'), // the recipe it was forked from; a relation below, no FK in the database
		// Who can see it: see VISIBILITIES and #lib/server/visibility.ts.
		visibility: text().$type<Visibility>().notNull().default('private'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
		// Bumped once per committed save (version or settings-only). The edit form
		// sends it back and a save with a stale value is refused.
		editRevision: integer('edit_revision').notNull().default(0),
		// In the Trash since then: hidden everywhere but the owner's Trash, and
		// removed for good 30 days later. Null for a live recipe.
		deletedAt: timestamp('deleted_at'),
		// Deleted for good by its author while savers held kept copies: gone from
		// the author's Trash and every list, the row and the versions those savers
		// keep stay only for them (keptCopyOf, #lib/server/visibility.ts). The
		// last copy removed deletes the rest. Null otherwise.
		erasedAt: timestamp('erased_at'),
		// Full-text search vector: title (weight A) + description (weight B)
		// Generated automatically by Postgres — never set manually
		fts: tsvector('fts').generatedAlwaysAs(
			sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '')), 'B')`
		)
	},
	(table) => [
		index('recipes_fts_idx').using('gin', table.fts),
		// A profile's recipes, the library and the feed read by author.
		index('recipes_author_idx').on(table.authorId),
		// Fork counts on every card list read by parent.
		index('recipes_parent_idx').on(table.parentId),
		// Newest first among live recipes: visibleTo always filters deleted_at
		// is null, and Discover takes the first 60. Ascending on purpose: read
		// backward it is `updated_at desc` (nulls first), which a desc index
		// (nulls last) is not.
		index('recipes_live_updated_idx')
			.on(table.updatedAt)
			.where(sql`${table.deletedAt} is null`),
		// A profile's live recipes newest first (cardList by author), read
		// backward like the one above; the keyset cursor is a range on it.
		index('recipes_author_live_updated_idx')
			.on(table.authorId, table.updatedAt, table.id)
			.where(sql`${table.deletedAt} is null`),
		// A cook's Trash, newest deletion first (inTrashOf, the Trash page), over
		// trashed rows only.
		index('recipes_trash_idx')
			.on(table.authorId, table.deletedAt)
			.where(sql`${table.deletedAt} is not null and ${table.erasedAt} is null`),
		// Search's title matches (textSearch, recipeSearch.ts): its words, and its
		// start (starts_with on lower(title) reads a text_pattern_ops btree).
		index('recipes_title_search_idx').using('gin', sql`to_tsvector('english', ${table.title})`),
		index('recipes_title_prefix_idx').on(sql`lower(${table.title}) text_pattern_ops`)
	]
).enableRLS();

// ─── Friendships ─────────────────────────────────────────────────────────────

export const FRIENDSHIP_STATUSES = ['pending', 'accepted', 'blocked'] as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

// One row per pair, whichever way round: the requester asked, the addressee
// answers. An accepted row makes both people friends of each other. A blocked
// row's requester is the blocker. The pair index refuses a reverse duplicate.
export const friendships = pgTable(
	'friendships',
	{
		requesterId: text('requester_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		addresseeId: text('addressee_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		status: text().$type<FriendshipStatus>().notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	// The key serves lookups by requester; this index the other direction.
	(table) => [
		primaryKey({ columns: [table.requesterId, table.addresseeId] }),
		index('friendships_addressee_idx').on(table.addresseeId),
		uniqueIndex('friendships_pair_idx').on(
			sql`least(${table.requesterId}, ${table.addresseeId})`,
			sql`greatest(${table.requesterId}, ${table.addresseeId})`
		),
		check('friendships_not_self', sql`${table.requesterId} <> ${table.addresseeId}`)
	]
).enableRLS();

// Mute hides the muted person's feed items from the muter only.
export const mutes = pgTable(
	'mutes',
	{
		muterId: text('muter_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		mutedId: text('muted_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.muterId, table.mutedId] })]
).enableRLS();

export const REPORT_TARGETS = ['log_entry', 'recipe', 'user'] as const;

export type ReportTarget = (typeof REPORT_TARGETS)[number];

// Read by hand; moderation is manual. target_id is text so one column holds a
// log entry or recipe id and a profile id alike.
export const reports = pgTable('reports', {
	id: serial().primaryKey(),
	reporterId: text('reporter_id')
		.notNull()
		.references(() => profiles.id, { onDelete: 'cascade' }),
	targetType: text('target_type').$type<ReportTarget>().notNull(),
	targetId: text('target_id').notNull(),
	reason: text().notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
}).enableRLS();

// ─── Journal ──────────────────────────────────────────────────────────────────

export const LOG_AUDIENCES = ['private', 'friends'] as const;

export type LogAudience = (typeof LOG_AUDIENCES)[number];

// One log entry: what someone cooked, when, and who sees it. The source is
// derived: a recipe id names the recipe, none means improvised. recipe_id has
// no FK (like recipes.parent_id), so a deleted recipe leaves it pointing at no
// row and the Journal can say "Recipe deleted" rather than "Improvised"; recipe
// ids are serial and never reused.
export const logEntries = pgTable(
	'log_entries',
	{
		id: serial().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		recipeId: integer('recipe_id'),
		versionId: integer('version_id').references(() => recipeVersions.id, {
			onDelete: 'set null'
		}),
		dish: text().notNull(),
		cookedOn: date('cooked_on').notNull(),
		servings: integer(),
		photoUrl: text('photo_url'),
		// An http(s) page the dish came from, for an entry with no recipe attached.
		sourceUrl: text('source_url'),
		caption: text(),
		note: text(),
		audience: text().$type<LogAudience>().notNull().default('private'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		index('log_entries_user_idx').on(table.userId, table.cookedOn),
		// The Friends feed's entries newest first (feedFor), read backward and
		// filtered by friend: one ordered walk instead of every friend's entries
		// sorted. A (user_id, created_at) index cannot keep that order across
		// several friends, and the planner passed it over.
		index('log_entries_friends_created_idx')
			.on(table.createdAt, table.id)
			.where(sql`${table.audience} = 'friends'`)
	]
).enableRLS();

export const likes = pgTable(
	'likes',
	{
		userId: text('user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		logEntryId: integer('log_entry_id')
			.notNull()
			.references(() => logEntries.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	// The key serves "did I like it"; this index the count per entry.
	(table) => [
		primaryKey({ columns: [table.userId, table.logEntryId] }),
		index('likes_entry_idx').on(table.logEntryId)
	]
).enableRLS();

// ─── Tags ─────────────────────────────────────────────────────────────────────

// Slugs are stored lowercase because tag pages look them up lowercased; the
// check holds that for every writer, scripts and hand-run SQL included.
export const tags = pgTable(
	'tags',
	{
		id: serial().primaryKey(),
		name: text().notNull().unique(),
		slug: text().notNull().unique()
	},
	(t) => [check('tags_slug_lowercase', sql`${t.slug} = lower(${t.slug})`)]
).enableRLS();

export const recipesToTags = pgTable(
	'recipes_to_tags',
	{
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.recipeId, table.tagId] })]
).enableRLS();

// ─── Favorites ────────────────────────────────────────────────────────────────

// A save. Version numbers, not ids: they are what the page and ?version= name,
// and a recipe's numbers never change (versions are append-only).
export const favorites = pgTable(
	'favorites',
	{
		userId: text('user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		// Keep this version: the version the saver opens on arrival. Null follows
		// the author's latest.
		keptVersion: integer('kept_version'),
		// The version the saver keeps as a read-only copy, set when the author made
		// the recipe private or moved it to the Trash while the saver could see it
		// (their kept version, else the latest then); null for a saver who could
		// not. Read only while the recipe stays withdrawn (keptCopyOf).
		copyVersion: integer('copy_version'),
		// The saver's private note: never shown to anyone else, the author included.
		note: text()
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.recipeId] }),
		index('favorites_created_at_idx').on(table.createdAt),
		// The save count on every recipe view; the primary key leads with the user.
		index('favorites_recipe_idx').on(table.recipeId),
		check('favorites_note_length', sql`char_length(${table.note}) <= ${sql.raw(String(NOTE_MAX))}`)
	]
).enableRLS();

// ─── Collections ──────────────────────────────────────────────────────────────

// A cook's named shelf in their Cookbook, filled by hand. Names are unique per
// owner whatever their case. Counts and order are read, never stored.
export const collections = pgTable(
	'collections',
	{
		id: serial().primaryKey(),
		ownerId: text('owner_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('collections_owner_name_idx').on(table.ownerId, sql`lower(${table.name})`)
	]
).enableRLS();

// A recipe in a collection: a link, never a copy. Goes with its collection
// and with the recipe's permanent deletion; a trashed recipe keeps its rows.
export const collectionRecipes = pgTable(
	'collection_recipes',
	{
		collectionId: integer('collection_id')
			.notNull()
			.references(() => collections.id, { onDelete: 'cascade' }),
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		addedAt: timestamp('added_at').notNull().defaultNow()
	},
	// The key serves a collection's recipes; this index a recipe's collections.
	(table) => [
		primaryKey({ columns: [table.collectionId, table.recipeId] }),
		index('collection_recipes_recipe_idx').on(table.recipeId)
	]
).enableRLS();

// ─── Recipe Versions ──────────────────────────────────────────────────────────

export const recipeVersions = pgTable(
	'recipe_versions',
	{
		id: serial().primaryKey(),
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		versionNumber: integer('version_number').notNull(),
		commitMessage: text('commit_message').notNull(),
		title: text().notNull(),
		description: text(),
		servings: integer(),
		// Yield as typed ("12 buns"); on versions only, since no list or search reads it.
		makes: text(),
		prepTimeMinutes: integer('prep_time_minutes'),
		cookTimeMinutes: integer('cook_time_minutes'),
		// Source, rest, make-ahead and the notes live on versions only, like
		// makes: no list reads them, and search reads versions (recipeSearch.ts).
		restTimeMinutes: integer('rest_time_minutes'),
		makeAhead: text('make_ahead'),
		sourceName: text('source_name'),
		sourceUrl: text('source_url'),
		notes: text(),
		equipment: text(),
		storage: text(),
		reheating: text(),
		imageUrl: text('image_url'),
		ingredients: jsonb().notNull().$type<Ingredient[]>(),
		steps: jsonb().notNull().$type<Step[]>(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' })
	},
	(table) => [
		unique().on(table.recipeId, table.versionNumber),
		// The Friends feed and recent-activity reads order versions by time.
		index('recipe_versions_created_at_idx').on(table.createdAt),
		// A profile's change count reads by who made the version.
		index('recipe_versions_created_by_idx').on(table.createdBy),
		// Search reads every version's text (textSearch, recipeSearch.ts) through
		// these, the functions of drizzle/0019_search-functions.sql. An index, not
		// a stored column, so no version row a page loads carries a tsvector.
		index('recipe_versions_search_idx').using(
			'gin',
			sql`recipe_version_doc(${table.title}, ${table.description}, ${table.sourceName}, ${table.ingredients}, ${table.steps}, ${table.notes}, ${table.makeAhead}, ${table.equipment}, ${table.storage}, ${table.reheating})`
		),
		index('recipe_versions_names_search_idx').using(
			'gin',
			sql`to_tsvector('english', recipe_ingredient_names(${table.ingredients}))`
		)
	]
).enableRLS();

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
	recipes: many(recipes),
	versions: many(recipeVersions)
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
	author: one(profiles, {
		fields: [recipes.authorId],
		references: [profiles.id]
	}),
	parent: one(recipes, {
		fields: [recipes.parentId],
		references: [recipes.id],
		relationName: 'forks'
	}),
	forks: many(recipes, { relationName: 'forks' }),
	recipesToTags: many(recipesToTags),
	versions: many(recipeVersions)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	recipesToTags: many(recipesToTags)
}));

export const recipesToTagsRelations = relations(recipesToTags, ({ one }) => ({
	recipe: one(recipes, {
		fields: [recipesToTags.recipeId],
		references: [recipes.id]
	}),
	tag: one(tags, {
		fields: [recipesToTags.tagId],
		references: [tags.id]
	})
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
	user: one(profiles, {
		fields: [favorites.userId],
		references: [profiles.id]
	}),
	recipe: one(recipes, {
		fields: [favorites.recipeId],
		references: [recipes.id]
	})
}));

export const recipeVersionsRelations = relations(recipeVersions, ({ one }) => ({
	recipe: one(recipes, {
		fields: [recipeVersions.recipeId],
		references: [recipes.id]
	}),
	creator: one(profiles, {
		fields: [recipeVersions.createdBy],
		references: [profiles.id]
	})
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Profile = InferSelectModel<typeof profiles>;
export type Recipe = InferSelectModel<typeof recipes>;
export type RecipeVersion = InferSelectModel<typeof recipeVersions>;
export type Tag = InferSelectModel<typeof tags>;
export type LogEntry = InferSelectModel<typeof logEntries>;
