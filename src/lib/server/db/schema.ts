import { pgTable, serial, text, integer, timestamp, primaryKey, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
	id: text().primaryKey(), // Supabase auth user ID
	username: text().notNull().unique(),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at').defaultNow(),
});

// ─── Recipes ─────────────────────────────────────────────────────────────────

export const recipes = pgTable('recipes', {
	id: serial().primaryKey(),
	authorId: text('author_id').references(() => profiles.id, { onDelete: 'set null' }),
	slug: text().notNull().unique(),
	// Metadata (edited directly, not versioned)
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
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable('tags', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	slug: text().notNull().unique(),
});

export const recipesToTags = pgTable('recipes_to_tags', {
	recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
	tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
	primaryKey({ columns: [table.recipeId, table.tagId] }),
]);

// ─── Recipe Versions ──────────────────────────────────────────────────────────

export const recipeVersions = pgTable('recipe_versions', {
	id: serial().primaryKey(),
	recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
	versionNumber: integer('version_number').notNull(),
	commitMessage: text('commit_message').notNull(),
	ingredients: jsonb().notNull().$type<Ingredient[]>(),
	steps: jsonb().notNull().$type<Step[]>(),
	createdAt: timestamp('created_at').defaultNow(),
	createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
	recipes: many(recipes),
	versions: many(recipeVersions),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
	author: one(profiles, {
		fields: [recipes.authorId],
		references: [profiles.id],
	}),
	parent: one(recipes, {
		fields: [recipes.parentId],
		references: [recipes.id],
		relationName: 'forks',
	}),
	forks: many(recipes, { relationName: 'forks' }),
	recipesToTags: many(recipesToTags),
	versions: many(recipeVersions),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	recipesToTags: many(recipesToTags),
}));

export const recipesToTagsRelations = relations(recipesToTags, ({ one }) => ({
	recipe: one(recipes, {
		fields: [recipesToTags.recipeId],
		references: [recipes.id],
	}),
	tag: one(tags, {
		fields: [recipesToTags.tagId],
		references: [tags.id],
	}),
}));

export const recipeVersionsRelations = relations(recipeVersions, ({ one }) => ({
	recipe: one(recipes, {
		fields: [recipeVersions.recipeId],
		references: [recipes.id],
	}),
	creator: one(profiles, {
		fields: [recipeVersions.createdBy],
		references: [profiles.id],
	}),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Ingredient = {
	amount: string;
	unit: string;
	name: string;
};

export type Step = {
	step: number;
	text: string;
};

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Recipe = InferSelectModel<typeof recipes>;
export type NewRecipe = InferInsertModel<typeof recipes>;

export type RecipeVersion = InferSelectModel<typeof recipeVersions>;
export type NewRecipeVersion = InferInsertModel<typeof recipeVersions>;

export type Tag = InferSelectModel<typeof tags>;
