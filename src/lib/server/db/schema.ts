import {pgTable, serial, text, integer, timestamp, primaryKey} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';
import type {InferSelectModel, InferInsertModel} from 'drizzle-orm';

export const recipes = pgTable('recipes', {
	// Database info
	id: serial('id').primaryKey(),
	userId: text('user_id'), // Assuming userId is a string, adjust as necessary

	// Recipe info
	title: text('title').notNull(),
	imageUrl: text('image_url'),
	rating: integer('rating').default(0).notNull(),
	servings: integer('servings'),
	prepTimeMinutes: integer('prep_time_minutes'),
	cookTimeMinutes: integer('cook_time_minutes'),
	description: text('description'),
	ingredients: text('ingredients').notNull(),
	instructions: text('instructions').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export const tags = pgTable('tags', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
});

export const recipesToTags = pgTable('recipes_to_tags', {
	recipeId: integer('recipe_id').notNull().references(() => recipes.id),
	tagId: integer('tag_id').notNull().references(() => tags.id),
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