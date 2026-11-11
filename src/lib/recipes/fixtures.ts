// Test fixtures for recipe content. Build ingredients and steps through these
// rather than object literals, so a shape change touches one file.
import { parseIngredientLine } from './ingredients.js';
import type { Ingredient, Step, StepAnnotation, RecipeContent } from './types.js';

export function makeIngredient(line: string): Ingredient {
	return parseIngredientLine(line);
}

export function makeStep(text: string, annotation?: StepAnnotation): Step {
	return annotation ? { text, annotation } : { text };
}

/** Rows as they parse under a "# Name" heading. */
export function inGroup<T extends Ingredient | Step>(group: string, rows: T[]): T[] {
	return rows.map((row) => ({ ...row, group }));
}

export function makeContent(overrides: Partial<RecipeContent> = {}): RecipeContent {
	return {
		title: 'Cookies',
		description: null,
		servings: 4,
		makes: null,
		prepTimeMinutes: 10,
		cookTimeMinutes: 20,
		restTimeMinutes: null,
		sourceName: null,
		sourceUrl: null,
		notes: null,
		makeAhead: null,
		equipment: null,
		storage: null,
		reheating: null,
		imageUrl: null,
		ingredients: [makeIngredient('1 cup flour')],
		steps: [makeStep('Mix.')],
		...overrides
	};
}

/** Every field set: a dough and a filling making 12 buns, grouped steps with notes, rest time, a source. */
export function makeBuns(overrides: Partial<RecipeContent> = {}): RecipeContent {
	return makeContent({
		title: 'Cinnamon buns',
		description: 'Soft, sticky, best warm.',
		servings: null,
		makes: '12 buns',
		prepTimeMinutes: 30,
		cookTimeMinutes: 25,
		restTimeMinutes: 90,
		sourceName: 'Grandma Ruth',
		sourceUrl: 'https://example.com/buns',
		notes: 'Bake on the middle shelf.\nThey freeze well.',
		makeAhead: 'Shape the night before and chill.',
		equipment: 'Stand mixer, 9 by 13 tin',
		storage: 'Airtight tin, 2 days.',
		reheating: '10 minutes at 150°C.',
		imageUrl: 'https://example.com/buns.jpg',
		ingredients: [
			...inGroup('Dough', [makeIngredient('500 g flour'), makeIngredient('250 ml warm milk')]),
			...inGroup('Filling', [
				makeIngredient('100 g soft butter'),
				makeIngredient('2 tbsp cinnamon')
			])
		],
		steps: [
			...inGroup('Dough', [
				makeStep('Knead for 10 minutes.'),
				makeStep('Rise until doubled.', { type: 'tip', text: 'A barely warm oven helps.' })
			]),
			...inGroup('Filling', [
				makeStep('Spread, roll and cut into 12.', {
					type: 'warning',
					text: 'Cold butter tears the dough.'
				})
			])
		],
		...overrides
	});
}

// A version as the version bar and header list it: number and commit message.
export function makeVersion(versionNumber: number, commitMessage: string) {
	return { id: versionNumber, versionNumber, commitMessage };
}
