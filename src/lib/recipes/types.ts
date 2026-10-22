// Recipe content types. Ingredients and steps are stored as JSONB on
// recipe_versions; these describe the shape of that JSON on both client and server.

export type Ingredient = {
	text: string;
	quantity: number | null;
	quantity2: number | null;
	unit: string;
	name: string;
};

export const STEP_ANNOTATION_TYPES = ['tip', 'warning', 'substitution'] as const;
export type StepAnnotationType = (typeof STEP_ANNOTATION_TYPES)[number];

export type StepAnnotation = {
	type: StepAnnotationType;
	text: string;
};

// Steps are numbered by their position in the list.
export type Step = {
	text: string;
	annotation?: StepAnnotation;
};
