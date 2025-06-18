// Now, define the main Recipe, using the Ingredient interface
export interface Recipe {
	id: number; // Or 'string' if you are using UUIDs
	title: string;
	description: string;

	prepTimeMinutes?: number;
	cookTimeMinutes?: number;

	servings?: number;

	ingredients: string[]; // An array of ingredient strings
	instructions: string[];

	imageUrl?: string; // The '?' makes this property optional

	createdAt?: Date; // Or 'string' if you store it as an ISO string
	updatedAt?: Date; // Or 'string'
}