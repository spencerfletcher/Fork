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
	 *  text, never read as servings; with no servings, the scaler counts its
	 *  leading number, or is a bare multiplier when it has none (scale.ts). */
	makes: string | null;
	/** Times in whole minutes, typed as words (times.ts). Each is its own
	 *  span: no total is stored or shown, since they can overlap. */
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	/** Rising, chilling, marinating: waiting the cook does not attend. */
	restTimeMinutes: number | null;
	/** Where the recipe came from outside Fork: a book, a person, a website.
	 *  Not Fork authorship and not the parent a fork came from. */
	sourceName: string | null;
	/** An http(s) address, never fetched; shown as a link out. */
	sourceUrl: string | null;
	/** The author's notes for the whole recipe, line breaks kept. */
	notes: string | null;
	/** Short labelled notes beside it ("Dough keeps 3 days chilled"). */
	makeAhead: string | null;
	equipment: string | null;
	storage: string | null;
	reheating: string | null;
	imageUrl: string | null;
	ingredients: Ingredient[];
	steps: Step[];
};

// A tag as lists, chips and tabs show it.
export type TagChip = { id: number; name: string; slug: string };
