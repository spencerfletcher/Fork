// First, define a shape for a single ingredient
export interface Ingredient {
	id: number; // Or 'string' if you are using UUIDs
	name: string;
	quantity: string; // e.g., "1 cup", "200g", "1 tsp"
}

// Now, define the main Recipe, using the Ingredient interface
export interface Recipe {
	id: number; // Or 'string' if you are using UUIDs
	title: string;
	description: string;

	prepTimeMinutes?: number;
	cookTimeMinutes?: number;

	servings?: number;

	ingredients: Ingredient[]; // An array of Ingredient objects
	instructions: string[];

	imageUrl?: string; // The '?' makes this property optional

	createdAt?: Date; // Or 'string' if you store it as an ISO string
	updatedAt?: Date; // Or 'string'
}