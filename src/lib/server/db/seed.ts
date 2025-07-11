import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {config} from 'dotenv';

// Import your recipes table schema
import {recipes, categories, recipesToCategories} from './schema';
import {isNull} from 'drizzle-orm';

// Load environment variables from your .env file
config({path: '.env'});

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

// The new seed data, based on your input
const recipeData = [
	{
		title: 'Spaghetti Carbonara',
		description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.',
		// The arrays are joined into single strings to fit the 'text' column type
		ingredients: ["Spaghetti", "Eggs", "Pancetta", "Parmesan cheese", "Black pepper"].join('\n'),
		instructions: ['Cook spaghetti', 'Fry pancetta', 'Mix with eggs and cheese'].join('\n'),
		imageUrl: 'https://nqcqdpcczabsadfowrxd.supabase.co/storage/v1/object/public/recipe-images//Carbonara.webp',
		servings: 4,
		prepTimeMinutes: 10,
		cookTimeMinutes: 20,
	},
	{
		title: 'Chicken Tikka Masala',
		description:
			'A popular Indian dish consisting of roasted marinated chicken in a spiced curry sauce.',
		ingredients: ["Chicken", "Yogurt", "Tomato sauce", "Spices", "Cream"].join('\n'),
		instructions: ['Marinate chicken', 'Grill chicken', 'Serve with sauce'].join('\n'),
		imageUrl: 'https://nqcqdpcczabsadfowrxd.supabase.co/storage/v1/object/public/recipe-images//Chicken.jpg',
	},
	{
		title: 'Beef Stroganoff',
		description: 'A Russian dish of sautéed pieces of beef served in a sauce with sour cream.',
		ingredients: ["Beef", "Mushrooms", "Sour cream", "Onions", "Egg noodles"].join('\n'),
		instructions: ['Sauté beef', 'Add mushrooms and sour cream', 'Serve over noodles'].join('\n'),
		imageUrl: 'https://nqcqdpcczabsadfowrxd.supabase.co/storage/v1/object/public/recipe-images//Beef.jpg',
	},
	{
		title: 'Vegetable Stir Fry',
		description: 'A quick and healthy dish made with a variety of vegetables stir-fried in a wok.',
		ingredients: ["Broccoli", "Bell peppers", "Carrots", "Soy sauce", "Garlic"].join('\n'),
		instructions: ['Stir-fry vegetables in a wok with soy sauce and garlic.'].join('\n'),
		// Note: The image path here was the same as Beef Stroganoff in your example
		imageUrl: 'https://nqcqdpcczabsadfowrxd.supabase.co/storage/v1/object/public/recipe-images//Beef.jpg',
	},
	{
		title: 'Chocolate Chip Cookies',
		description: 'Classic cookies with chocolate chips, perfect for any occasion.',
		ingredients: ["Flour", "Sugar", "Butter", "Chocolate chips", "Eggs", "Vanilla extract"].join('\n'),
		instructions: ['Mix ingredients', 'Form cookies', 'Bake until golden'].join('\n'),
		// Note: The image path here was the same as Beef Stroganoff in your example
	}
];

const categoriesData = [
	{name: 'Italian'},
	{name: 'Indian'},
	{name: 'Russian'},
	{name: 'Vegetarian'},
	{name: 'Dessert'},
]

async function seed() {
	console.log('Seeding database...');

	// Create a new connection for seeding
	const client = postgres(process.env.DATABASE_URL!, {max: 1});
	const db = drizzle(client);

	// Clear existing data to ensure a clean slate
	console.log('Clearing existing recipes...');
	await db.delete(recipes).where(isNull(recipes.userId));

	// Insert the new data
	console.log('Inserting new recipe data...');
	const insertedRecipes = await db
		.insert(recipes)
		.values(recipeData)
		.returning({id: recipes.id, title: recipes.title});

	// Insert the new data if there isn't already a category with the same name
	console.log('Inserting new category data...');
	const insertedCategories = await db
		.insert(categories)
		.values(categoriesData)
		.onConflictDoUpdate({target: categories.name, set: {name: categories.name}})
		.returning({id: categories.id, name: categories.name});

	// Helper to find IDs from the returned data
	const categoryId = (name: string) => insertedCategories.find(c => c.name === name)!.id;
	const recipeId = (title: string) => insertedRecipes.find(r => r.title === title)!.id;

	await db.insert(recipesToCategories).values([
		{recipeId: recipeId('Spaghetti Carbonara'), categoryId: categoryId('Italian')},
		{recipeId: recipeId('Chicken Tikka Masala'), categoryId: categoryId('Indian')},
		{recipeId: recipeId('Beef Stroganoff'), categoryId: categoryId('Russian')},
		{recipeId: recipeId('Vegetable Stir Fry'), categoryId: categoryId('Vegetarian')},
		{recipeId: recipeId('Chocolate Chip Cookies'), categoryId: categoryId('Dessert')},
	]);

	console.log('Seeding complete.');

	// Make sure to close the connection
	await client.end();
}

seed().catch((err) => {
	console.error('Error during seeding:', err);
	process.exit(1);
});