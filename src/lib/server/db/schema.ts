import {pgTable, serial, text, integer, timestamp} from 'drizzle-orm/pg-core';
import type {InferSelectModel, InferInsertModel} from 'drizzle-orm';

export const recipes = pgTable('recipes', {
	id: serial('id').primaryKey(),
	userId: text('user_id'), // Assuming userId is a string, adjust as necessary
	title: text('title').notNull(),
	description: text('description'),
	prepTimeMinutes: integer('prep_time_minutes'),
	cookTimeMinutes: integer('cook_time_minutes'),
	servings: integer('servings'),
	imageUrl: text('image_url'),
	// Storing ingredients and instructions as text for now
	ingredients: text('ingredients').notNull(),
	instructions: text('instructions').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Type for SELECT queries
export type Recipe = InferSelectModel<typeof recipes>;

// Type for INSERT queries
export type NewRecipe = InferInsertModel<typeof recipes>;