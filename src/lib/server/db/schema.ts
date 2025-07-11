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

export const categories = pgTable('categories', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
});

export const recipesToCategories = pgTable('recipes_to_categories', {
	recipeId: integer('recipe_id').notNull().references(() => recipes.id),
	categoryId: integer('category_id').notNull().references(() => categories.id),
}, (table) => [
	primaryKey({columns: [table.recipeId, table.categoryId]}),
]);

// Define the relationships for easy querying
export const recipesRelations = relations(recipes, ({many}) => ({
	recipesToCategories: many(recipesToCategories),
}));

// Define the relationships for easy querying
export const categoriesRelations = relations(categories, ({many}) => ({
	recipesToCategories: many(recipesToCategories),
}));

export const recipesToCategoriesRelations = relations(recipesToCategories, ({one}) => ({
	recipe: one(recipes, {
		fields: [recipesToCategories.recipeId],
		references: [recipes.id],
	}),
	category: one(categories, {
		fields: [recipesToCategories.categoryId],
		references: [categories.id],
	}),
}));

// Type for SELECT queries
export type Recipe = InferSelectModel<typeof recipes>;

// Type for INSERT queries
export type NewRecipe = InferInsertModel<typeof recipes>;