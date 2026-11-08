// Recipe content types. Ingredients and steps are stored as JSONB on
// recipe_versions; these describe the shape of that JSON on both client and server.

export type Ingredient = {
	text: string;
	quantity: number | null;
	quantity2: number | null;
	unit: string;
	name: string;
	/** The "# Name" heading the line sits under; absent before the first one (groups.ts). */
	group?: string;
};

export const STEP_ANNOTATION_TYPES = ['tip', 'warning', 'substitution'] as const;
export type StepAnnotationType = (typeof STEP_ANNOTATION_TYPES)[number];

export type StepAnnotation = {
	type: StepAnnotationType;
	text: string;
};

// Steps are numbered by their position in the list, straight through groups.
export type Step = {
	text: string;
	annotation?: StepAnnotation;
	/** The "# Name" heading the step sits under; absent before the first one (groups.ts). */
	group?: string;
};

export type RecipeContent = {
	title: string;
	description: string | null;
	servings: number | null;
	/** What one batch produces when that isn't portions ("12 buns"). Free
	 *  text, never read as servings; the scale factor comes from servings alone. */
	makes: string | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	imageUrl: string | null;
	ingredients: Ingredient[];
	steps: Step[];
};

// A tag as lists, chips and tabs show it.
export type TagChip = { id: number; name: string; slug: string };
