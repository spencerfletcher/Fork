import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { nanoid } from 'nanoid';

import { recipes, tags, recipesToTags, recipeVersions, profiles } from './schema';
import { slugify } from '#lib/helpers.js';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { parseStepText } from '#lib/recipes/steps.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { describeSeedTarget } from './seedTarget';

// `pnpm db:seed` targets the local stack in .env.local; `pnpm db:seed:prod`
// skips that file so .env (hosted) wins. describeSeedTarget refuses a mix of
// the two before anything is deleted.
const prod = process.env.SEED_TARGET === 'prod';
if (!prod) config({ path: '.env.local', override: true });
config({ path: '.env', override: false });

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Fork-Demo-2025!';
const SEED_USER_EMAIL = 'spencer@fork.dev';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!SUPABASE_URL) throw new Error('PUBLIC_SUPABASE_URL is not set');
if (!SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY is not set');
const TARGET = describeSeedTarget(
	prod,
	DATABASE_URL,
	SUPABASE_URL,
	process.env.SUPABASE_PROJECT_ID
);

// ─── Seed data ────────────────────────────────────────────────────────────────

const COOKIE_INGREDIENTS_V1 = parseIngredientText(`
2¼ cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup unsalted butter, softened
¾ cup granulated sugar
¾ cup packed brown sugar
1 tsp vanilla extract
2 large eggs
2 cups chocolate chips
`);

const COOKIE_INGREDIENTS_V2 = parseIngredientText(`
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
`);

const COOKIE_STEPS = parseStepText(`
Preheat oven to 375°F (190°C). Line two baking sheets with parchment paper.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Beat butter and both sugars with an electric mixer on medium speed until light and fluffy, about 3 minutes.

Add eggs one at a time, beating well after each addition. Beat in vanilla extract.

Gradually stir in the flour mixture until just combined. Fold in chocolate chips.

Drop rounded tablespoons of dough onto prepared baking sheets. Bake 9–11 minutes until edges are golden. Cool on baking sheet for 5 minutes before transferring.
`);

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
const COOKIE_INGREDIENTS_V3 = parseIngredientText(`
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
`);

const COOKIE_STEPS_V3 = parseStepText(`
Preheat oven to 375°F (190°C). Line two baking sheets with parchment paper.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Beat butter and both sugars with an electric mixer on medium speed until light and fluffy, about 3 minutes.

Add eggs one at a time, beating well after each addition. Beat in vanilla extract.

Gradually stir in the flour mixture until just combined. Fold in chocolate chips, reserving a handful to press into the tops. Cover and chill the dough at least 2 hours — cold dough spreads less, so the extra brown sugar reads as chew rather than sprawl.

Drop rounded tablespoons of chilled dough onto prepared baking sheets, pressing the reserved chips into the tops. Bake 9–11 minutes until edges are golden. Sprinkle with flaky sea salt while still hot, then cool on baking sheet for 5 minutes before transferring.
`);

const BROWN_BUTTER_INGREDIENTS = parseIngredientText(`
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
`);

const BROWN_BUTTER_STEPS = parseStepText(`
Melt butter in a light-colored saucepan over medium heat, stirring frequently. Cook until foam subsides and milk solids turn golden brown, about 5–7 minutes. It should smell nutty. Pour into a bowl and let cool 10 minutes.

Whisk flour, baking soda, and salt in a medium bowl. Set aside.

Whisk brown butter, granulated sugar, and brown sugar together until combined. Add eggs one at a time, whisking well, then add vanilla and espresso powder.

Fold in flour mixture until just combined, then fold in chocolate chips. Refrigerate dough for at least 30 minutes (or overnight for best results).

Preheat oven to 375°F (190°C). Line baking sheets with parchment. Drop rounded tablespoons of dough 2 inches apart.

Bake 9–11 minutes until edges are set. Immediately sprinkle with flaky sea salt. Cool on baking sheet 5 minutes before transferring.
`);

const TIKKA_INGREDIENTS_V1 = parseIngredientText(`
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
`);

const TIKKA_STEPS_V1 = parseStepText(`
Combine chicken with yogurt, lemon juice, garam masala, cumin, coriander, and turmeric. Marinate at least 1 hour or overnight in the fridge.

Grill or broil marinated chicken until cooked through and lightly charred, about 8–10 minutes. Set aside.

Melt butter in a large skillet over medium heat. Sauté onion until softened, about 5 minutes. Add garlic and ginger, cook 1 minute more.

Add crushed tomatoes and remaining spices. Simmer 15 minutes, stirring occasionally, until sauce thickens.

Add chicken to the sauce. Pour in cream and stir to combine. Simmer 10 minutes.

Serve over basmati rice with warm naan bread.
`);

const TIKKA_INGREDIENTS_V2 = parseIngredientText(`
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
`);

// v3 changes only what its commit message claims: the paprika added to the
// ingredients in v2 finally reaches the marinade, and the sauce gains a butter
// finish. An earlier draft also quietly dropped "in the fridge", "about 5
// minutes" and "stirring occasionally" — detail a cook wants, deleted for no
// stated reason, which is exactly what makes a diff read as churn.
//
// The butter finish is appended to step 5 rather than inserted as a new step 6,
// because diffSteps matches by position and a mid-list insert renumbers
// everything after it into a cascade of false changes.
const TIKKA_STEPS_V3 = parseStepText(`
Combine chicken with yogurt, lemon juice, garam masala, cumin, coriander, turmeric, and smoked paprika. Marinate at least 1 hour or overnight in the fridge.

Grill or broil marinated chicken until cooked through and lightly charred, about 8–10 minutes. Set aside.

Melt butter in a large skillet over medium heat. Sauté onion until softened, about 5 minutes. Add garlic and ginger, cook 1 minute more.

Add crushed tomatoes and remaining spices. Simmer 15 minutes, stirring occasionally, until sauce thickens.

Add chicken to the sauce. Pour in cream and stir to combine. Simmer 10 minutes, then stir in a final tablespoon of cold butter for richness and gloss.

Serve over basmati rice with warm naan bread. Garnish with fresh cilantro.
`);

// ─── Recipes ──────────────────────────────────────────────────────────────────
//
// One object per recipe: the recipe-level settings and its versions, oldest
// first. The recipes row copies title, description, servings and times from
// the last version, so those are only written here once, on the version.

type SeedVersion = RecipeContent & { commitMessage: string; createdAt: string };

type SeedRecipe = {
	slug: string; // prefix; a random suffix is added at insert
	imageUrl: string;
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
	cookTimeMinutes: 11
};

const TIKKA_META = {
	title: 'Chicken Tikka Masala',
	description:
		'Rich, aromatic, and deeply satisfying — a restaurant-quality tikka masala built from a yogurt-marinated chicken and a slow-simmered tomato cream sauce.',
	servings: 4,
	prepTimeMinutes: 20,
	cookTimeMinutes: 40
};

const SEED: SeedRecipe[] = [
	{
		slug: 'classic-chocolate-chip-cookies',
		imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
		tags: ['Dessert', 'Baking', 'American'],
		isPublic: true,
		versions: [
			{
				...COOKIE_META,
				ingredients: COOKIE_INGREDIENTS_V1,
				steps: COOKIE_STEPS,
				commitMessage: 'Initial recipe',
				createdAt: '2025-10-14'
			},
			{
				...COOKIE_META,
				ingredients: COOKIE_INGREDIENTS_V2,
				steps: COOKIE_STEPS,
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
				ingredients: COOKIE_INGREDIENTS_V3,
				steps: COOKIE_STEPS_V3,
				commitMessage:
					'Chill the dough and shift the sugar toward brown — thicker cookies, less cloying, smaller batch',
				createdAt: '2026-07-19'
			}
		]
	},
	{
		slug: 'brown-butter-chocolate-chip-cookies',
		imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
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
				ingredients: BROWN_BUTTER_INGREDIENTS,
				steps: BROWN_BUTTER_STEPS,
				commitMessage: 'Swapped melted butter for brown butter, added flaky sea salt topping',
				createdAt: '2026-03-01'
			}
		]
	},
	{
		slug: 'chicken-tikka-masala',
		imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
		tags: ['Dinner', 'Indian', 'Spicy'],
		isPublic: true,
		versions: [
			{
				...TIKKA_META,
				ingredients: TIKKA_INGREDIENTS_V1,
				steps: TIKKA_STEPS_V1,
				commitMessage: 'Initial recipe',
				createdAt: '2025-11-05'
			},
			{
				...TIKKA_META,
				ingredients: TIKKA_INGREDIENTS_V2,
				steps: TIKKA_STEPS_V1,
				commitMessage: 'Adjusted spice blend — more garam masala, less cumin, added smoked paprika',
				createdAt: '2026-01-20'
			},
			{
				...TIKKA_META,
				ingredients: TIKKA_INGREDIENTS_V2,
				steps: TIKKA_STEPS_V3,
				commitMessage:
					'Worked the smoked paprika into the marinade, finished the sauce with cold butter',
				createdAt: '2026-03-10'
			}
		]
	}
];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
	console.log(`🌱 Seeding ${TARGET}...`);

	const client = postgres(DATABASE_URL!, { max: 1 });
	const db = drizzle(client);

	const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	// ── Ensure recipe-images storage bucket exists ───────────────────────────
	console.log('Checking storage bucket...');
	const { data: buckets } = await supabaseAdmin.storage.listBuckets();
	const bucketExists = buckets?.some((b) => b.name === 'recipe-images');
	if (!bucketExists) {
		await supabaseAdmin.storage.createBucket('recipe-images', {
			public: true,
			allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
			fileSizeLimit: 5 * 1024 * 1024 // 5 MB
		});
		console.log('Created recipe-images bucket');
	}

	// ── Wipe existing seed data ──────────────────────────────────────────────
	console.log('Clearing existing data...');
	await db.delete(recipesToTags);
	await db.delete(recipeVersions);
	await db.delete(recipes);
	await db.delete(profiles);

	// Delete existing seed user from Supabase Auth
	const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
	const existingUser = existingUsers?.users?.find((u) => u.email === SEED_USER_EMAIL);
	if (existingUser) {
		console.log('Deleting existing seed user from Auth...');
		await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
	}

	// ── Create seed user ─────────────────────────────────────────────────────
	console.log('Creating seed user...');
	const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
		email: SEED_USER_EMAIL,
		password: SEED_USER_PASSWORD,
		email_confirm: true
	});
	if (authError || !authData.user) {
		throw new Error(`Failed to create seed user: ${authError?.message}`);
	}
	const userId = authData.user.id;
	await db.insert(profiles).values({ id: userId, username: 'spencerfletcher' });
	console.log(`Created user @spencerfletcher (${userId})`);

	// ── Seed tags ─────────────────────────────────────────────────────────────
	console.log('Seeding tags...');
	const tagRows = await db
		.insert(tags)
		.values([
			{ name: 'Dessert', slug: slugify('Dessert') },
			{ name: 'Baking', slug: slugify('Baking') },
			{ name: 'American', slug: slugify('American') },
			{ name: 'Dinner', slug: slugify('Dinner') },
			{ name: 'Indian', slug: slugify('Indian') },
			{ name: 'Spicy', slug: slugify('Spicy') },
			// Deliberately orphaned — attached to no recipe below. Exercises the
			// search loader's innerJoin, which hides tags with zero recipes.
			{ name: 'Unused', slug: slugify('Unused') }
		])
		.onConflictDoUpdate({ target: tags.name, set: { name: tags.name } })
		.returning({ id: tags.id, name: tags.name });

	const tagId = (name: string) => tagRows.find((t) => t.name === name)!.id;

	// ── Recipes ──────────────────────────────────────────────────────────────
	const idBySlug = new Map<string, number>();
	for (const recipe of SEED) {
		const latest = recipe.versions.at(-1)!;
		console.log(`Seeding ${latest.title}...`);
		const [row] = await db
			.insert(recipes)
			.values({
				authorId: userId,
				slug: `${recipe.slug}-${nanoid(6)}`,
				// Copies of the latest version, per the ownership rule in schema.ts.
				title: latest.title,
				description: latest.description,
				servings: latest.servings,
				prepTimeMinutes: latest.prepTimeMinutes,
				cookTimeMinutes: latest.cookTimeMinutes,
				imageUrl: recipe.imageUrl,
				isPublic: recipe.isPublic,
				parentId: recipe.forkOf ? idBySlug.get(recipe.forkOf.slug) : null,
				forkedAt: recipe.forkOf ? new Date(recipe.forkOf.forkedAt) : null
			})
			.returning({ id: recipes.id });
		idBySlug.set(recipe.slug, row.id);

		await db
			.insert(recipesToTags)
			.values(recipe.tags.map((name) => ({ recipeId: row.id, tagId: tagId(name) })));

		await db.insert(recipeVersions).values(
			recipe.versions.map(({ createdAt, ...version }, i) => ({
				...version,
				recipeId: row.id,
				versionNumber: i + 1,
				createdBy: userId,
				createdAt: new Date(createdAt)
			}))
		);
	}

	console.log('✅ Seeding complete.');
	console.log(
		`\nSeed user credentials:\n  Email: ${SEED_USER_EMAIL}\n  Password: ${SEED_USER_PASSWORD}`
	);

	await client.end();
}

seed().catch((err) => {
	console.error('Error during seeding:', err);
	process.exit(1);
});
