import { describe, test, expect } from 'vitest';
import {
	changedGroups,
	contentChanged,
	generatedCommitMessage,
	type ContentGroup
} from './content';
import { makeContent, makeIngredient, makeStep } from './fixtures';
import type { RecipeContent } from './types';

const base = makeContent();

describe('changedGroups', () => {
	test('identical contents are unchanged', () => {
		expect(changedGroups(base, makeContent())).toEqual([]);
		expect(contentChanged(base, makeContent())).toBe(false);
	});

	test.each<[string, Partial<RecipeContent>, ContentGroup]>([
		['title', { title: 'Biscuits' }, 'title'],
		['description', { description: 'Crisp edges.' }, 'description'],
		['imageUrl', { imageUrl: 'https://cdn/new.png' }, 'photo'],
		['servings', { servings: 8 }, 'servings'],
		['prepTimeMinutes', { prepTimeMinutes: 15 }, 'times'],
		['cookTimeMinutes', { cookTimeMinutes: 25 }, 'times'],
		['ingredients', { ingredients: [makeIngredient('2 cups flour')] }, 'ingredients'],
		['steps', { steps: [makeStep('Stir.')] }, 'steps']
	])('%s alone is a change in its group', (_, overrides, group) => {
		expect(changedGroups(base, makeContent(overrides))).toEqual([group]);
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
