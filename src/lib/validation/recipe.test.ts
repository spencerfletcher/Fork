import { describe, test, expect } from 'vitest';

// Validation functions for recipe form
// These would typically be in a separate validation utility file

export function validateTitle(title: string): { valid: boolean; error?: string } {
	if (!title || typeof title !== 'string') {
		return { valid: false, error: 'A title is required.' };
	}

	const trimmed = title.trim();
	if (trimmed.length === 0) {
		return { valid: false, error: 'Title cannot be empty.' };
	}

	const MAX_LENGTH = 200;
	if (trimmed.length > MAX_LENGTH) {
		return { valid: false, error: `Title must be less than ${MAX_LENGTH} characters.` };
	}

	return { valid: true };
}

export function validateIngredients(ingredients: string): { valid: boolean; error?: string } {
	if (!ingredients || typeof ingredients !== 'string') {
		return { valid: false, error: 'Ingredients are required.' };
	}

	const trimmed = ingredients.trim();
	if (trimmed.length === 0) {
		return { valid: false, error: 'Ingredients are required.' };
	}

	const MAX_LENGTH = 5000;
	if (trimmed.length > MAX_LENGTH) {
		return { valid: false, error: 'Ingredients are too long.' };
	}

	return { valid: true };
}

export function validateInstructions(instructions: string): { valid: boolean; error?: string } {
	if (!instructions || typeof instructions !== 'string') {
		return { valid: false, error: 'Instructions are required.' };
	}

	const trimmed = instructions.trim();
	if (trimmed.length === 0) {
		return { valid: false, error: 'Instructions are required.' };
	}

	const MAX_LENGTH = 10000;
	if (trimmed.length > MAX_LENGTH) {
		return { valid: false, error: 'Instructions are too long.' };
	}

	return { valid: true };
}

export function validateImageUrl(url: string): { valid: boolean; error?: string } {
	if (!url || url.trim() === '') {
		// Image URL is optional
		return { valid: true };
	}

	// Check if URL has protocol
	const hasProtocol = url.startsWith('http://') || url.startsWith('https://');

	try {
		// Try to parse the URL
		new URL(url);

		// URL is valid, but check protocol
		if (!hasProtocol) {
			return { valid: false, error: 'Image URL must start with http:// or https://' };
		}

		return { valid: true };
	} catch {
		// URL parsing failed
		// If it looks like it might be a URL without protocol (has a dot), suggest adding protocol
		if (!hasProtocol && url.includes('.')) {
			return { valid: false, error: 'Image URL must start with http:// or https://' };
		}

		return { valid: false, error: 'Invalid image URL format.' };
	}
}

export function validateRating(rating: string | number): { valid: boolean; error?: string } {
	if (!rating || rating === '') {
		// Rating is optional
		return { valid: true };
	}

	const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;

	if (isNaN(numRating)) {
		return { valid: false, error: 'Rating must be a number.' };
	}

	if (numRating < 1 || numRating > 5) {
		return { valid: false, error: 'Rating must be between 1 and 5.' };
	}

	return { valid: true };
}

export function validateDescription(description: string): { valid: boolean; error?: string } {
	if (!description || description.trim() === '') {
		// Description is optional
		return { valid: true };
	}

	const MAX_LENGTH = 1000;
	if (description.length > MAX_LENGTH) {
		return { valid: false, error: 'Description is too long.' };
	}

	return { valid: true };
}

// Tests
describe('Recipe Form Validation', () => {
	describe('Title Validation', () => {
		test('should accept valid title', () => {
			const result = validateTitle('Chocolate Chip Cookies');
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		test('should reject empty title', () => {
			const result = validateTitle('');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('required');
		});

		test('should reject whitespace-only title', () => {
			const result = validateTitle('   ');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('empty');
		});

		test('should reject title exceeding max length', () => {
			const longTitle = 'a'.repeat(201);
			const result = validateTitle(longTitle);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('less than 200');
		});

		test('should accept title at max length', () => {
			const maxTitle = 'a'.repeat(200);
			const result = validateTitle(maxTitle);
			expect(result.valid).toBe(true);
		});

		test('should trim title and validate', () => {
			const result = validateTitle('  Valid Title  ');
			expect(result.valid).toBe(true);
		});
	});

	describe('Ingredients Validation', () => {
		test('should accept valid ingredients', () => {
			const ingredients = '2 cups flour\n1 cup sugar\n3 eggs';
			const result = validateIngredients(ingredients);
			expect(result.valid).toBe(true);
		});

		test('should reject empty ingredients', () => {
			const result = validateIngredients('');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('required');
		});

		test('should reject whitespace-only ingredients', () => {
			const result = validateIngredients('   \n   ');
			expect(result.valid).toBe(false);
		});

		test('should reject ingredients exceeding max length', () => {
			const longIngredients = 'a'.repeat(5001);
			const result = validateIngredients(longIngredients);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('too long');
		});

		test('should accept ingredients at max length', () => {
			const maxIngredients = 'a'.repeat(5000);
			const result = validateIngredients(maxIngredients);
			expect(result.valid).toBe(true);
		});
	});

	describe('Instructions Validation', () => {
		test('should accept valid instructions', () => {
			const instructions = 'Mix flour and sugar\nAdd eggs\nBake at 350F';
			const result = validateInstructions(instructions);
			expect(result.valid).toBe(true);
		});

		test('should reject empty instructions', () => {
			const result = validateInstructions('');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('required');
		});

		test('should reject whitespace-only instructions', () => {
			const result = validateInstructions('   \n   ');
			expect(result.valid).toBe(false);
		});

		test('should accept instructions with line breaks', () => {
			const instructions = '1. Step one\n2. Step two\n3. Step three';
			const result = validateInstructions(instructions);
			expect(result.valid).toBe(true);
		});
	});

	describe('Image URL Validation', () => {
		test('should accept valid http URL', () => {
			const result = validateImageUrl('http://example.com/image.jpg');
			expect(result.valid).toBe(true);
		});

		test('should accept valid https URL', () => {
			const result = validateImageUrl('https://example.com/image.jpg');
			expect(result.valid).toBe(true);
		});

		test('should accept empty URL (optional field)', () => {
			const result = validateImageUrl('');
			expect(result.valid).toBe(true);
		});

		test('should reject URL without protocol', () => {
			const result = validateImageUrl('example.com/image.jpg');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('http:// or https://');
		});

		test('should reject invalid URL format', () => {
			const result = validateImageUrl('not a url');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid');
		});

		test('should reject URL with wrong protocol', () => {
			const result = validateImageUrl('ftp://example.com/image.jpg');
			expect(result.valid).toBe(false);
		});
	});

	describe('Rating Validation', () => {
		test('should accept valid rating', () => {
			const result = validateRating(4.5);
			expect(result.valid).toBe(true);
		});

		test('should accept rating as string', () => {
			const result = validateRating('4.5');
			expect(result.valid).toBe(true);
		});

		test('should accept empty rating (optional)', () => {
			const result = validateRating('');
			expect(result.valid).toBe(true);
		});

		test('should accept minimum rating (1)', () => {
			const result = validateRating(1);
			expect(result.valid).toBe(true);
		});

		test('should accept maximum rating (5)', () => {
			const result = validateRating(5);
			expect(result.valid).toBe(true);
		});

		test('should reject rating below 1', () => {
			const result = validateRating(0.5);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('between 1 and 5');
		});

		test('should reject rating above 5', () => {
			const result = validateRating(5.5);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('between 1 and 5');
		});

		test('should reject non-numeric rating', () => {
			const result = validateRating('not a number');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('number');
		});
	});

	describe('Description Validation', () => {
		test('should accept valid description', () => {
			const result = validateDescription('A delicious chocolate dessert');
			expect(result.valid).toBe(true);
		});

		test('should accept empty description (optional)', () => {
			const result = validateDescription('');
			expect(result.valid).toBe(true);
		});

		test('should reject description exceeding max length', () => {
			const longDescription = 'a'.repeat(1001);
			const result = validateDescription(longDescription);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('too long');
		});

		test('should accept description at max length', () => {
			const maxDescription = 'a'.repeat(1000);
			const result = validateDescription(maxDescription);
			expect(result.valid).toBe(true);
		});
	});
});
