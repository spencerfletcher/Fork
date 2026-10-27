import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

import { recipes, tags, recipesToTags, recipeVersions, profiles } from './schema';
import { slugify, randomSuffix } from '#lib/helpers.js';
import { SEED } from './seedData';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { parseStepText } from '#lib/recipes/steps.js';
import { loadEnv, targetFromEnv } from './env';

// `pnpm db:seed` targets the local stack; `pnpm db:seed:prod` sets DB_TARGET=prod
// and loadEnv refuses a mix of local and hosted before anything is deleted.
const env = loadEnv(targetFromEnv());
const DATABASE_URL = env.DATABASE_URL;
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY;
const TARGET = env.description;
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Fork-Demo-2025!';
const SEED_USER_EMAIL = 'spencer@fork.dev';

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
	console.log(`🌱 Seeding ${TARGET}...`);

	const client = postgres(DATABASE_URL, { max: 1 });
	const db = drizzle(client);

	const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
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
				slug: `${recipe.slug}-${randomSuffix()}`,
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
			recipe.versions.map(({ createdAt, ingredientsText, stepsText, ...version }, i) => ({
				...version,
				ingredients: parseIngredientText(ingredientsText),
				steps: parseStepText(stepsText),
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
