import {pgTable, serial, text, integer, timestamp} from 'drizzle-orm/pg-core';
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

// Type for SELECT queries
export type Recipe = InferSelectModel<typeof recipes>;

// Type for INSERT queries
export type NewRecipe = InferInsertModel<typeof recipes>;