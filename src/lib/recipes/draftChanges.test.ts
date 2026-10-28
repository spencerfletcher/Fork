import { describe, test, expect } from 'vitest';
import { draftChangedGroups, describeGroups } from './draftChanges.js';
import { parseDraftContent, type RecipeDraft } from './validation.js';

const base: RecipeDraft = {
	title: 'Cookies',
	description: '',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.',
	commitMessage: '',
	editRevision: '3',
	isPublic: true,
	tags: ['Dessert'],
	hadPhoto: false,
	removeImage: false
};

describe('draftChangedGroups', () => {
	const from = parseDraftContent(base);
	test('an untouched draft changes nothing', () => {
		expect(draftChangedGroups(from, { ...base }, false)).toEqual([]);
	});

	test('whitespace and a commit message are not changes', () => {
		const draft = {
			...base,
			title: ' Cookies ',
			ingredients: '1 cup flour\n\n2 eggs \n',
			commitMessage: 'x'
		};
		expect(draftChangedGroups(from, draft, false)).toEqual([]);
	});

	test('lists changed groups in the server order', () => {
		const draft = { ...base, steps: 'Mix well.\n\nBake.', servings: '8' };
		expect(draftChangedGroups(from, draft, false)).toEqual(['servings', 'steps']);
	});

	test('a photo change is a group of its own, in order', () => {
		expect(draftChangedGroups(from, { ...base, title: 'Biscuits' }, true)).toEqual([
			'title',
			'photo'
		]);
	});

	test('tags and visibility are settings, not content', () => {
		expect(draftChangedGroups(from, { ...base, isPublic: false, tags: [] }, false)).toEqual([]);
	});

	test('an invalid draft is told apart from an unchanged one', () => {
		expect(
			draftChangedGroups(from, { ...base, title: '', prepTimeMinutes: '-5' }, false)
		).toBeNull();
	});
});

describe('describeGroups', () => {
	test('joins with commas and a final and', () => {
		expect(describeGroups(['ingredients'])).toBe('ingredients');
		expect(describeGroups(['ingredients', 'steps'])).toBe('ingredients and steps');
		expect(describeGroups(['servings', 'ingredients', 'steps'])).toBe(
			'servings, ingredients and steps'
		);
	});
});
