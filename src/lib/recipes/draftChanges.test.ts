import { describe, test, expect } from 'vitest';
import { draftChangedGroups } from './draftChanges.js';
import { parseDraftContent, type RecipeDraft } from './validation.js';

const base: RecipeDraft = {
	title: 'Cookies',
	description: '',
	servings: '4',
	makes: '',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.',
	commitMessage: '',
	editRevision: '3',
	visibility: 'public',
	tags: ['Dessert'],
	hadPhoto: false,
	removeImage: false
};

describe('draftChangedGroups', () => {
	const from = parseDraftContent(base);
	test('an untouched draft changes nothing', () => {
		expect(draftChangedGroups(from, { ...base }, false)).toEqual([]);
	});

	test('a typed yield is a yield change, and a heading an ingredients change', () => {
		const draft = { ...base, makes: '12 buns', ingredients: '# Dough\n1 cup flour\n2 eggs' };
		expect(draftChangedGroups(from, draft, false)).toEqual(['yield', 'ingredients']);
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
		expect(draftChangedGroups(from, { ...base, visibility: 'private', tags: [] }, false)).toEqual(
			[]
		);
	});

	test('an invalid draft is told apart from an unchanged one', () => {
		expect(
			draftChangedGroups(from, { ...base, title: '', prepTimeMinutes: '-5' }, false)
		).toBeNull();
	});
});
