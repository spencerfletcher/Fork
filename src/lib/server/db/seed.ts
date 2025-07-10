import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {config} from 'dotenv';

// Import your recipes table schema
import {recipes} from './schema';

// Load environment variables from your .env file
config({path: '.env'});

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

// The new seed data, based on your input
const seedData = [
	{
		title: 'Spaghetti Carbonara',
		description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.',
		// The arrays are joined into single strings to fit the 'text' column type
		ingredients: ["Spaghetti", "Eggs", "Pancetta", "Parmesan cheese", "Black pepper"].join('\n'),
		instructions: ['Cook spaghetti', 'Fry pancetta', 'Mix with eggs and cheese'].join('\n'),
		imageUrl: 'https://nqcqdpcczabsadfowrxd.supabase.co/storage/v1/object/public/recipe-images//Carbonara.webp',
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

async function seed() {
	console.log('Seeding database...');

	// Create a new connection for seeding
	const client = postgres(process.env.DATABASE_URL!, {max: 1});
	const db = drizzle(client);

	// Clear existing data to ensure a clean slate
	console.log('Clearing existing recipes...');
	await db.delete(recipes);

	// Insert the new data
	console.log('Inserting new seed data...');
	await db.insert(recipes).values(seedData);

	console.log('Seeding complete.');

	// Make sure to close the connection
	await client.end();
}

seed().catch((err) => {
	console.error('Error during seeding:', err);
	process.exit(1);
});