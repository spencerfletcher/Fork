import {pgTable, serial, text, integer, timestamp} from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	prepTimeMinutes: integer('prep_time_minutes'),
	cookTimeMinutes: integer('cook_time_minutes'),
	servings: integer('servings'),
	imageUrl: text('image_url'),
	// We can't store arrays directly, so for now let's store ingredients/instructions as text
	// A better approach would be to use separate related tables.
	ingredients: text('ingredients').notNull(),
	instructions: text('instructions').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});