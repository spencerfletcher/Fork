import { describe, test, expect } from 'vitest';
import { eq, or } from 'drizzle-orm';
import { recipes } from './db/schema.js';
import { canView, visibleTo } from './visibility.js';

const OWNER = { id: 'owner' };
const OTHER = { id: 'other' };

describe('canView', () => {
	test('anyone can view a public recipe', () => {
		const row = { isPublic: true, authorId: OWNER.id };
		expect(canView(row, null)).toBe(true);
		expect(canView(row, undefined)).toBe(true);
		expect(canView(row, OTHER)).toBe(true);
	});

	test('a private recipe is visible to its author only', () => {
		const row = { isPublic: false, authorId: OWNER.id };
		expect(canView(row, OWNER)).toBe(true);
		expect(canView(row, OTHER)).toBe(false);
		expect(canView(row, null)).toBe(false);
	});

	test('a private recipe whose author was deleted is visible to nobody', () => {
		const row = { isPublic: false, authorId: null };
		expect(canView(row, OTHER)).toBe(false);
		expect(canView(row, null)).toBe(false);
	});
});

describe('visibleTo', () => {
	test('a logged-out visitor sees public recipes only', () => {
		expect(visibleTo(null)).toEqual(eq(recipes.isPublic, true));
		expect(visibleTo(undefined)).toEqual(eq(recipes.isPublic, true));
	});

	test('a signed-in visitor also sees their own', () => {
		expect(visibleTo(OTHER)).toEqual(
			or(eq(recipes.isPublic, true), eq(recipes.authorId, OTHER.id))
		);
	});
});
