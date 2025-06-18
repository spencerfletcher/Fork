
import type {Ingredient, Recipe} from '$lib/types';
export const ingredients: Ingredient[] = [
	// Placeholder for initial ingredients
	{id: 1, name: 'Spaghetti', quantity: '200g'},
	{id: 2, name: 'Eggs', quantity: '2'},
	{id: 3, name: 'Pancetta', quantity: '100g'}
];

export const recipes: Recipe[] = [
	{
		id: 1,
		title: 'Spaghetti Carbonara',
		description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.',
		ingredients: ingredients,
		instructions: ['Cook spaghetti, fry pancetta, mix with eggs and cheese.']
	},
	{
		id: 2,
		title: 'Chicken Tikka Masala',
		description:
			'A popular Indian dish consisting of roasted marinated chicken in a spiced curry sauce.',
		ingredients: ingredients,
		instructions: ['Marinate chicken, grill, and serve with sauce.']
	},
	{
		id: 3,
		title: 'Beef Stroganoff',
		description: 'A Russian dish of sautéed pieces of beef served in a sauce with sour cream.',
		ingredients: ingredients,
		instructions: ['Sauté beef, add mushrooms and sour cream, serve over noodles.']
	}
];