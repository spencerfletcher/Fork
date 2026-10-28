// The demo recipes, as data. Imported by seed.ts, which writes them, and by
// the e2e suite, which asserts on what it wrote, so a renamed recipe changes
// both. Pure data: no runtime imports, so Playwright can load it too; the
// ingredient and step text is parsed by seed.ts at insert time.
import type { RecipeContent } from '../../recipes/types.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

const COOKIE_INGREDIENTS_V1 = `
2¼ cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup unsalted butter, softened
¾ cup granulated sugar
¾ cup packed brown sugar
1 tsp vanilla extract
2 large eggs
2 cups chocolate chips
`;

const COOKIE_INGREDIENTS_V2 = `
2¼ cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup unsalted butter, softened
¾ cup granulated sugar
¾ cup packed brown sugar
2 tsp vanilla extract
2 large eggs
2 cups chocolate chips
¼ tsp espresso powder
`;

const COOKIE_STEPS = `
Preheat oven to 375°F (190°C). Line two baking sheets with parchment paper.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Beat butter and both sugars with an electric mixer on medium speed until light and fluffy, about 3 minutes.

Add eggs one at a time, beating well after each addition. Beat in vanilla extract.

Gradually stir in the flour mixture until just combined. Fold in chocolate chips.

Drop rounded tablespoons of dough onto prepared baking sheets. Bake 9–11 minutes until edges are golden. Cool on baking sheet for 5 minutes before transferring.
`;

// Version 3 is the diff the landing page showcases, so it is shaped to the
// strengths of the diff engine as well as to the story. Every ingredient change
// has a step that acts on it — the sugar ratio shifts, and the chill and the
// salt are what that ratio needs.
//
// It deliberately edits the two existing steps in place rather than inserting a
// new one: diffSteps matches by position, so inserting mid-list renumbers
// everything after it and renders as a cascade of unrelated changes. It also
// avoids renaming an ingredient, which diffIngredients reports as a removal plus
// an addition rather than one modification. Both are documented limitations in
// lib/recipes/diff.ts.
const COOKIE_INGREDIENTS_V3 = `
2¼ cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup unsalted butter, softened
½ cup granulated sugar
1 cup packed brown sugar
2 tsp vanilla extract
2 large eggs
2 cups chocolate chips
¼ tsp espresso powder
1 tsp flaky sea salt, for topping
`;

const COOKIE_STEPS_V3 = `
Preheat oven to 375°F (190°C). Line two baking sheets with parchment paper.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Beat butter and both sugars with an electric mixer on medium speed until light and fluffy, about 3 minutes.

Add eggs one at a time, beating well after each addition. Beat in vanilla extract.

Gradually stir in the flour mixture until just combined. Fold in chocolate chips, reserving a handful to press into the tops. Cover and chill the dough at least 2 hours — cold dough spreads less, so the extra brown sugar reads as chew rather than sprawl.

Drop rounded tablespoons of chilled dough onto prepared baking sheets, pressing the reserved chips into the tops. Bake 9–11 minutes until edges are golden. Sprinkle with flaky sea salt while still hot, then cool on baking sheet for 5 minutes before transferring.
`;

const BROWN_BUTTER_INGREDIENTS = `
2¼ cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup unsalted butter
¾ cup granulated sugar
¾ cup packed brown sugar
2 tsp vanilla extract
2 large eggs
2 cups chocolate chips
¼ tsp espresso powder
1 tsp flaky sea salt, for topping
`;

const BROWN_BUTTER_STEPS = `
Melt butter in a light-colored saucepan over medium heat, stirring frequently. Cook until foam subsides and milk solids turn golden brown, about 5–7 minutes. It should smell nutty. Pour into a bowl and let cool 10 minutes.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Whisk brown butter, granulated sugar, and brown sugar together until combined. Add eggs one at a time, whisking well, then add vanilla and espresso powder.

Fold in flour mixture until just combined, then fold in chocolate chips. Refrigerate dough for at least 30 minutes (or overnight for best results).

Preheat oven to 375°F (190°C). Line baking sheets with parchment. Drop rounded tablespoons of dough 2 inches apart.

Bake 9–11 minutes until edges are set. Immediately sprinkle with flaky sea salt. Cool on baking sheet 5 minutes before transferring.
`;

const TIKKA_INGREDIENTS_V1 = `
2 lbs boneless chicken thighs, cut into chunks
1 cup plain yogurt
2 tbsp lemon juice
2 tsp garam masala
1 tsp ground cumin
1 tsp ground coriander
1 tsp turmeric
3 tbsp butter
1 large onion, diced
4 cloves garlic, minced
1 tbsp fresh ginger, grated
28 oz canned crushed tomatoes
1 cup heavy cream
`;

const TIKKA_STEPS_V1 = `
Combine chicken with yogurt, lemon juice, garam masala, cumin, coriander, and turmeric. Marinate at least 1 hour or overnight in the fridge.

Grill or broil marinated chicken until cooked through and lightly charred, about 8–10 minutes. Set aside.

Melt butter in a large skillet over medium heat. Sauté onion until softened, about 5 minutes. Add garlic and ginger, cook 1 minute more.

Add crushed tomatoes and remaining spices. Simmer 15 minutes, stirring occasionally, until sauce thickens.

Add chicken to the sauce. Pour in cream and stir to combine. Simmer 10 minutes.

Serve over basmati rice with warm naan bread.
`;

const TIKKA_INGREDIENTS_V2 = `
2 lbs boneless chicken thighs, cut into chunks
1 cup plain yogurt
2 tbsp lemon juice
3 tsp garam masala
½ tsp ground cumin
1 tsp ground coriander
1 tsp turmeric
1 tsp smoked paprika
3 tbsp butter
1 large onion, diced
4 cloves garlic, minced
1 tbsp fresh ginger, grated
28 oz canned crushed tomatoes
1 cup heavy cream
`;

// v3 changes only what its commit message claims: the paprika added to the
// ingredients in v2 finally reaches the marinade, and the sauce gains a butter
// finish. An earlier draft also quietly dropped "in the fridge", "about 5
// minutes" and "stirring occasionally" — detail a cook wants, deleted for no
// stated reason, which is exactly what makes a diff read as churn.
//
// The butter finish is appended to step 5 rather than inserted as a new step 6,
// because diffSteps matches by position and a mid-list insert renumbers
// everything after it into a cascade of false changes.
const TIKKA_STEPS_V3 = `
Combine chicken with yogurt, lemon juice, garam masala, cumin, coriander, turmeric, and smoked paprika. Marinate at least 1 hour or overnight in the fridge.

Grill or broil marinated chicken until cooked through and lightly charred, about 8–10 minutes. Set aside.

Melt butter in a large skillet over medium heat. Sauté onion until softened, about 5 minutes. Add garlic and ginger, cook 1 minute more.

Add crushed tomatoes and remaining spices. Simmer 15 minutes, stirring occasionally, until sauce thickens.

Add chicken to the sauce. Pour in cream and stir to combine. Simmer 10 minutes, then stir in a final tablespoon of cold butter for richness and gloss.

Serve over basmati rice with warm naan bread. Garnish with fresh cilantro.
`;

const DAL_INGREDIENTS = `1 cup red lentils
3 cups water
1 tsp ground turmeric
1 tsp salt
2 tbsp butter
1 tsp cumin seeds
3 cloves garlic
1 green chilli
1 tomato
1/2 lemon
a handful of coriander leaves, to finish`;

const DAL_STEPS = `Rinse the lentils, then put them in a pot with the water, turmeric and salt. Bring to a boil, then simmer uncovered for 20 minutes, skimming any foam, until the lentils collapse. Whisk to smooth it out.

Melt the butter in a small pan over medium heat. Add the cumin seeds and let them crackle, then the garlic and chilli, both thinly sliced. Cook until the garlic turns golden, about a minute.
tip: Pull the pan the moment the garlic colours; it keeps cooking in the butter.

Dice the tomato, add it to the pan and cook for two minutes until it softens.

Pour the sizzling butter over the dal and stir it through. Squeeze in the lemon juice, taste for salt, and finish with the coriander.`;

// ─── Recipes ──────────────────────────────────────────────────────────────────
//
// One object per recipe: the recipe-level settings and its versions, oldest
// first. The recipes row copies title, description, photo, servings and times
// from the last version, so those are only written here once, on the version.

export type SeedVersion = Omit<RecipeContent, 'ingredients' | 'steps'> & {
	ingredientsText: string;
	stepsText: string;
	commitMessage: string;
	createdAt: string;
};

export type SeedRecipe = {
	slug: string; // prefix; a random suffix is added at insert
	tags: string[];
	isPublic: boolean;
	forkOf?: { slug: string; forkedAt: string }; // parent's slug prefix
	versions: SeedVersion[];
};

const COOKIE_META = {
	title: 'Classic Chocolate Chip Cookies',
	description:
		'The definitive chocolate chip cookie — crisp edges, chewy centers, and pockets of melted chocolate in every bite.',
	servings: 48,
	prepTimeMinutes: 15,
	cookTimeMinutes: 11,
	imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80'
};

const TIKKA_META = {
	title: 'Chicken Tikka Masala',
	description:
		'Rich, aromatic, and deeply satisfying — a restaurant-quality tikka masala built from a yogurt-marinated chicken and a slow-simmered tomato cream sauce.',
	servings: 4,
	prepTimeMinutes: 20,
	cookTimeMinutes: 40,
	imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80'
};

export const SEED: SeedRecipe[] = [
	{
		slug: 'classic-chocolate-chip-cookies',
		tags: ['Dessert', 'Baking', 'American'],
		isPublic: true,
		versions: [
			{
				...COOKIE_META,
				ingredientsText: COOKIE_INGREDIENTS_V1,
				stepsText: COOKIE_STEPS,
				commitMessage: 'Initial recipe',
				createdAt: '2025-10-14'
			},
			{
				...COOKIE_META,
				ingredientsText: COOKIE_INGREDIENTS_V2,
				stepsText: COOKIE_STEPS,
				commitMessage: 'Increased vanilla to 2 tsp, added pinch of espresso powder',
				createdAt: '2026-02-28'
			},
			// Renamed and a smaller, longer-baked batch, so the landing-page diff
			// and the compare page have metadata changes to show.
			{
				...COOKIE_META,
				title: 'Thick and Chewy Chocolate Chip Cookies',
				servings: 36,
				cookTimeMinutes: 13,
				ingredientsText: COOKIE_INGREDIENTS_V3,
				stepsText: COOKIE_STEPS_V3,
				commitMessage:
					'Chill the dough and shift the sugar toward brown — thicker cookies, less cloying, smaller batch',
				createdAt: '2026-07-19'
			}
		]
	},
	{
		slug: 'brown-butter-chocolate-chip-cookies',
		tags: ['Dessert', 'Baking', 'American'],
		isPublic: true,
		forkOf: { slug: 'classic-chocolate-chip-cookies', forkedAt: '2026-03-01' },
		versions: [
			{
				title: 'Brown Butter Chocolate Chip Cookies',
				description:
					'A fork of the classic — brown butter adds a deep, nutty complexity that takes these cookies to another level.',
				servings: 36,
				prepTimeMinutes: 20,
				cookTimeMinutes: 11,
				ingredientsText: BROWN_BUTTER_INGREDIENTS,
				stepsText: BROWN_BUTTER_STEPS,
				imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
				commitMessage: 'Swapped melted butter for brown butter, added flaky sea salt topping',
				createdAt: '2026-03-01'
			}
		]
	},
	{
		slug: 'chicken-tikka-masala',
		tags: ['Dinner', 'Indian', 'Spicy'],
		isPublic: true,
		versions: [
			{
				...TIKKA_META,
				ingredientsText: TIKKA_INGREDIENTS_V1,
				stepsText: TIKKA_STEPS_V1,
				commitMessage: 'Initial recipe',
				createdAt: '2025-11-05'
			},
			{
				...TIKKA_META,
				ingredientsText: TIKKA_INGREDIENTS_V2,
				stepsText: TIKKA_STEPS_V1,
				commitMessage: 'Adjusted spice blend — more garam masala, less cumin, added smoked paprika',
				createdAt: '2026-01-20'
			},
			{
				...TIKKA_META,
				ingredientsText: TIKKA_INGREDIENTS_V2,
				stepsText: TIKKA_STEPS_V3,
				commitMessage:
					'Worked the smoked paprika into the marinade, finished the sauce with cold butter',
				createdAt: '2026-03-10'
			}
		]
	},
	// No photo on purpose: the card and the recipe page have a no-photo state,
	// and nothing else in the seed exercises it.
	{
		slug: 'red-lentil-dal',
		tags: ['Dinner', 'Indian'],
		isPublic: true,
		versions: [
			{
				title: 'Weeknight Red Lentil Dal',
				description:
					'Soft, spoonable dal in half an hour, finished with a sizzle of cumin, garlic and chilli in butter.',
				servings: 4,
				prepTimeMinutes: 10,
				cookTimeMinutes: 25,
				imageUrl: null,
				ingredientsText: DAL_INGREDIENTS,
				stepsText: DAL_STEPS,
				commitMessage: 'Initial recipe',
				createdAt: '2026-02-14'
			}
		]
	}
];
