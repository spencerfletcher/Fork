import { describe, test, expect } from 'vitest';
import {
	changedGroups,
	generatedCommitMessage,
	recipeCopies,
	versionContent,
	type ContentGroup
} from './content';
import { getTableColumns } from 'drizzle-orm';
import { recipes, recipeVersions } from '#lib/server/db/schema.js';
import { inGroup, makeContent, makeIngredient, makeStep } from './fixtures';
import type { RecipeContent } from './types';

const base = makeContent();

describe('changedGroups', () => {
	test('identical contents are unchanged', () => {
		expect(changedGroups(base, makeContent())).toEqual([]);
	});

	test.each<[string, Partial<RecipeContent>, ContentGroup]>([
		['title', { title: 'Biscuits' }, 'title'],
		['description', { description: 'Crisp edges.' }, 'description'],
		['imageUrl', { imageUrl: 'https://cdn/new.png' }, 'photo'],
		['servings', { servings: 8 }, 'servings'],
		['prepTimeMinutes', { prepTimeMinutes: 15 }, 'times'],
		['cookTimeMinutes', { cookTimeMinutes: 25 }, 'times'],
		['ingredients', { ingredients: [makeIngredient('2 cups flour')] }, 'ingredients'],
		['steps', { steps: [makeStep('Stir.')] }, 'steps'],
		['makes', { makes: '12 buns' }, 'yield']
	])('%s alone is a change in its group', (_, overrides, group) => {
		expect(changedGroups(base, makeContent(overrides))).toEqual([group]);
	});

	test('moving a row into a group, or renaming the group, is a change in its list', () => {
		expect(
			changedGroups(base, makeContent({ ingredients: inGroup('Dough', base.ingredients) }))
		).toEqual(['ingredients']);
		expect(
			changedGroups(
				makeContent({ steps: inGroup('Mix', base.steps) }),
				makeContent({ steps: inGroup('Stir', base.steps) })
			)
		).toEqual(['steps']);
	});

	test('a yield change reads "Updated yield"', () => {
		expect(generatedCommitMessage(changedGroups(base, makeContent({ makes: '12 buns' })))).toBe(
			'Updated yield'
		);
	});

	test('rest is a time, the source name and link are one group, every note is "notes"', () => {
		expect(changedGroups(base, makeContent({ restTimeMinutes: 60 }))).toEqual(['times']);
		expect(changedGroups(base, makeContent({ sourceName: 'Gran' }))).toEqual(['source']);
		expect(changedGroups(base, makeContent({ sourceUrl: 'https://a.example/' }))).toEqual([
			'source'
		]);
		for (const field of ['notes', 'makeAhead', 'equipment', 'storage', 'reheating'] as const)
			expect(changedGroups(base, makeContent({ [field]: 'x' }))).toEqual(['notes']);
	});

	test('groups come back in the fixed order whatever changed', () => {
		const to = makeContent({ steps: [makeStep('Stir.')], servings: 8, title: 'Biscuits' });
		expect(changedGroups(base, to)).toEqual(['title', 'servings', 'steps']);
	});

	test('an ingredient wording change counts even when the parse is the same', () => {
		const to = makeContent({ ingredients: [makeIngredient('1 cup flour, sifted')] });
		expect(changedGroups(base, to)).toEqual(['ingredients']);
	});

	test('a step annotation change counts', () => {
		const to = makeContent({ steps: [makeStep('Mix.', { type: 'tip', text: 'gently' })] });
		expect(changedGroups(base, to)).toEqual(['steps']);
	});

	test('whitespace-only title and description differences are not changes', () => {
		const to = makeContent({ title: ' Cookies ', description: '' });
		expect(changedGroups(base, to)).toEqual([]);
	});

	test('parsed quantity and unit are ignored; only the typed text counts', () => {
		const [flour] = base.ingredients;
		const to = makeContent({ ingredients: [{ ...flour, quantity: 99, unit: 'tbsp' }] });
		expect(changedGroups(base, to)).toEqual([]);
	});
});

describe('generatedCommitMessage', () => {
	test('joins the groups in the order given', () => {
		expect(generatedCommitMessage(['servings', 'ingredients'])).toBe(
			'Updated servings, ingredients'
		);
	});
});

describe('versionContent', () => {
	test('carries every content column of a version and nothing else', () => {
		const NOT_CONTENT = [
			'id',
			'recipeId',
			'versionNumber',
			'commitMessage',
			'createdAt',
			'createdBy'
		];
		const expected = Object.keys(getTableColumns(recipeVersions)).filter(
			(c) => !NOT_CONTENT.includes(c)
		);
		const version = { ...makeContent(), id: 1, versionNumber: 2, commitMessage: 'm' };
		expect(Object.keys(versionContent(version)).sort()).toEqual(expected.sort());
	});

	test('the new fields carry their values', () => {
		const content = makeContent({
			restTimeMinutes: 480,
			sourceName: 'Jerusalem',
			sourceUrl: 'https://a.example/',
			notes: 'Line one\nLine two',
			makeAhead: 'Keeps 3 days',
			equipment: 'A tin',
			storage: 'Airtight',
			reheating: 'Low oven'
		});
		expect(versionContent(content)).toEqual(content);
	});
});

describe('recipeCopies', () => {
	// What a version holds that is not content, and the content that lives on
	// versions only. Every other version column must be copied to the recipe
	// row, so a new content column cannot be forgotten by create, edit or fork.
	const VERSION_ONLY = [
		'id',
		'recipeId',
		'versionNumber',
		'commitMessage',
		'createdAt',
		'createdBy',
		'ingredients',
		'steps',
		'makes',
		'restTimeMinutes',
		'sourceName',
		'sourceUrl',
		'notes',
		'makeAhead',
		'equipment',
		'storage',
		'reheating'
	];

	const content = makeContent({
		title: 'Soup',
		description: 'Warm.',
		servings: 6,
		prepTimeMinutes: 5,
		cookTimeMinutes: 40,
		imageUrl: 'https://img/soup.png'
	});

	test('copies every version column that is not named as version-only', () => {
		const expected = Object.keys(getTableColumns(recipeVersions)).filter(
			(c) => !VERSION_ONLY.includes(c)
		);
		expect(Object.keys(recipeCopies(content)).sort()).toEqual(expected.sort());
	});

	test('every copy is a column of the recipe row', () => {
		const columns = Object.keys(getTableColumns(recipes));
		for (const key of Object.keys(recipeCopies(content))) expect(columns).toContain(key);
	});

	test('the copies carry the content values', () => {
		expect(recipeCopies(content)).toEqual({
			title: content.title,
			description: content.description,
			servings: content.servings,
			prepTimeMinutes: content.prepTimeMinutes,
			cookTimeMinutes: content.cookTimeMinutes,
			imageUrl: content.imageUrl
		});
	});
});
