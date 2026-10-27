import type { Ingredient, Step } from '#lib/recipes/types.js';
import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	primaryKey,
	boolean,
	jsonb,
	customType,
	index,
	unique
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
	createdAt: timestamp('created_at').defaultNow()
}).enableRLS();

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
		parentId: integer('parent_id'), // self-referential FK added below via relations
		forkedAt: timestamp('forked_at'),
		// Visibility
		isPublic: boolean('is_public').notNull().default(true),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
		// Bumped once per committed save (version or settings-only). The edit form
		// sends it back and a save with a stale value is refused.
		editRevision: integer('edit_revision').notNull().default(0),
		// Full-text search vector: title (weight A) + description (weight B)
		// Generated automatically by Postgres — never set manually
		fts: tsvector('fts').generatedAlwaysAs(
			sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '')), 'B')`
		)
	},
	(table) => [index('recipes_fts_idx').using('gin', table.fts)]
).enableRLS();

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable('tags', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	slug: text().notNull().unique()
}).enableRLS();

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

export const favorites = pgTable(
	'favorites',
	{
		userId: text('user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [primaryKey({ columns: [table.userId, table.recipeId] })]
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
		prepTimeMinutes: integer('prep_time_minutes'),
		cookTimeMinutes: integer('cook_time_minutes'),
		imageUrl: text('image_url'),
		ingredients: jsonb().notNull().$type<Ingredient[]>(),
		steps: jsonb().notNull().$type<Step[]>(),
		createdAt: timestamp('created_at').defaultNow(),
		createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' })
	},
	(table) => [unique().on(table.recipeId, table.versionNumber)]
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
