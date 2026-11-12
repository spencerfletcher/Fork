// The varied seed's recipes, by the cooks in cooks.ts and the base three.
import type { VariedRecipe } from './types.js';
import { RECIPES_A } from './recipes-a.js';
import { RECIPES_B } from './recipes-b.js';
import { RECIPES_C } from './recipes-c.js';

export const VARIED_RECIPES: VariedRecipe[] = [...RECIPES_A, ...RECIPES_B, ...RECIPES_C];
