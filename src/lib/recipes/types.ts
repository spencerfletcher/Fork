// Recipe content types. Ingredients and steps are stored as JSONB on
// recipe_versions; these describe the shape of that JSON on both client and server.

export type Ingredient = {
	text: string;
	quantity: number | null;
	quantity2: number | null;
	unit: string;
	name: string;
};

export type StepAnnotationType = 'tip' | 'warning' | 'substitution';

export type StepAnnotation = {
	type: StepAnnotationType;
	text: string;
};

export type Step = {
	step: number;
	text: string;
	annotation?: StepAnnotation;
};
