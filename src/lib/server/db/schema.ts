import {pgTable, serial, text, integer, timestamp, primaryKey, numeric} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';
import type {InferSelectModel, InferInsertModel} from 'drizzle-orm';

export const recipes = pgTable('recipes', {
	// Database info
	id: serial().primaryKey(),
	userId: text('user_id'), // Assuming userId is a string, adjust as necessary
	slug: text().unique(),
	// Recipe info
	title: text().notNull(),
	imageUrl: text('image_url'),
	rating: numeric({precision: 2, scale: 1}),
	servings: integer(),
	prepTimeMinutes: integer('prep_time_minutes'),
	cookTimeMinutes: integer('cook_time_minutes'),
	description: text(),
	ingredients: text().notNull(),
	instructions: text().notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const tags = pgTable('tags', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	slug: text().notNull().unique(),
});

export const recipesToTags = pgTable('recipes_to_tags', {
	recipeId: integer('recipe_id').notNull().references(() => recipes.id, {onDelete: 'cascade'}),
	tagId: integer('tag_id').notNull().references(() => tags.id, {onDelete: 'cascade'}),
}, (table) => [
	primaryKey({columns: [table.recipeId, table.tagId]}),
]);

// Define the relationships for easy querying
export const recipesRelations = relations(recipes, ({many}) => ({
	recipesToTags: many(recipesToTags),
}));

// Define the relationships for easy querying
export const tagsRelations = relations(tags, ({many}) => ({
	recipesToTags: many(recipesToTags),
}));

export const recipesToTagsRelations = relations(recipesToTags, ({one}) => ({
	recipe: one(recipes, {
		fields: [recipesToTags.recipeId],
		references: [recipes.id],
	}),
	tag: one(tags, {
		fields: [recipesToTags.tagId],
		references: [tags.id],
	}),
}));

// Type for SELECT queries
export type Recipe = InferSelectModel<typeof recipes>;

// Type for INSERT queries
export type NewRecipe = InferInsertModel<typeof recipes>;