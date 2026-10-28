import { describe, test, expect } from 'vitest';
import { browseSections } from './browse.js';

const r = (id: number, daysAgo: number, forkCount = 0) => ({
	id,
	updatedAt: new Date(Date.UTC(2026, 9, 27 - daysAgo)),
	forkCount
});

describe('browseSections', () => {
	test('a small unforked collection is one Recent section', () => {
		const sections = browseSections([r(1, 2), r(2, 0), r(3, 1)]);
		expect(sections.map((s) => s.title)).toEqual(['Recent']);
		expect(sections[0].recipes.map((x) => x.id)).toEqual([2, 3, 1]);
	});

	test('forked recipes get their own section, most forks first', () => {
		const sections = browseSections([r(1, 0, 1), r(2, 1, 4), r(3, 2)]);
		expect(sections[1].title).toBe('Most forked');
		expect(sections[1].recipes.map((x) => x.id)).toEqual([2, 1]);
	});

	test('Recent is capped at eight and the rest land in All recipes', () => {
		const many = Array.from({ length: 10 }, (_, i) => r(i + 1, i));
		const sections = browseSections(many);
		expect(sections.map((s) => s.title)).toEqual(['Recent', 'All recipes']);
		expect(sections[0].recipes).toHaveLength(8);
		expect(sections[1].recipes.map((x) => x.id)).toEqual([9, 10]);
	});

	test('Most forked is capped at four', () => {
		const forked = Array.from({ length: 5 }, (_, i) => r(i + 1, i, 5 - i));
		expect(browseSections(forked)[1].recipes).toHaveLength(4);
	});

	test('a recipe with no updatedAt sorts last', () => {
		const sections = browseSections([{ id: 1, updatedAt: null, forkCount: 0 }, r(2, 3)]);
		expect(sections[0].recipes.map((x) => x.id)).toEqual([2, 1]);
	});

	test('an empty list gives no sections', () => {
		expect(browseSections([])).toEqual([]);
	});
});
