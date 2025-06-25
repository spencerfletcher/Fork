
import type {Recipe} from '$lib/types';

export const recipes: Recipe[] = [
	{
		id: 1,
		title: 'Spaghetti Carbonara',
		description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.',
		ingredients: ["Spaghetti", "Eggs", "Pancetta", "Parmesan cheese", "Black pepper"],
		instructions: ['Cook spaghetti, fry pancetta, mix with eggs and cheese.'],
		imageUrl: '/Carbonara.webp',
	},
	{
		id: 2,
		title: 'Chicken Tikka Masala',
		description:
			'A popular Indian dish consisting of roasted marinated chicken in a spiced curry sauce.',
		ingredients: ["Chicken", "Yogurt", "Tomato sauce", "Spices", "Cream"],
		instructions: ['Marinate chicken, grill, and serve with sauce.'],
		imageUrl: '/Chicken.jpg',
	},
	{
		id: 3,
		title: 'Beef Stroganoff',
		description: 'A Russian dish of sautéed pieces of beef served in a sauce with sour cream.',
		ingredients: ["Beef", "Mushrooms", "Sour cream", "Onions", "Egg noodles"],
		instructions: ['Sauté beef, add mushrooms and sour cream, serve over noodles.'],
		imageUrl: '/Beef.jpg',
	}
	,
	{
		id: 4,
		title: 'Vegetable Stir Fry',
		description: 'A quick and healthy dish made with a variety of vegetables stir-fried in a wok.',
		ingredients: ["Broccoli", "Bell peppers", "Carrots", "Soy sauce", "Garlic"],
		instructions: ['Stir-fry vegetables in a wok with soy sauce and garlic.'],
		imageUrl: '/Beef.jpg',
	}
	,
	{
		id: 5,
		title: 'Chocolate Chip Cookies',
		description: 'Classic cookies with chocolate chips, perfect for any occasion.',
		ingredients: ["Flour", "Sugar", "Butter", "Chocolate chips", "Eggs", "Vanilla extract"],
		instructions: ['Mix ingredients, form cookies, and bake until golden.'],
		imageUrl: '/Beef.jpg',
	}
];