import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

import {
	recipes,
	tags,
	recipesToTags,
	formerUsernames,
	reports,
	recipeVersions,
	profiles,
	friendships,
	logEntries,
	likes,
	collections,
	collectionRecipes
} from './schema';
import { slugify, randomSuffix } from '#lib/helpers.js';
import { recipeCopies } from '#lib/recipes/content.js';
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '#lib/recipes/validation.js';
import { SEED, SEED_LOG, type SeedUsername } from './seedData';
import { parseIngredientText } from '#lib/recipes/ingredients.js';
import { parseStepText } from '#lib/recipes/steps.js';
import { loadEnv, required, targetFromEnv } from './env';
import { allAuthUsers } from './seedAuth';

// `pnpm db:seed` targets the local stack, `pnpm db:seed:e2e` the suite's fork_e2e
// and `pnpm db:seed:prod` the hosted project; loadEnv refuses a mix of local and hosted before anything is deleted.
const env = loadEnv(targetFromEnv());
const DATABASE_URL = env.DATABASE_URL;
const SUPABASE_URL = env.SUPABASE_URL;
// Only the seed needs the secret key (it creates the seed user); migrate and drizzle-kit run without it.
const SUPABASE_SECRET_KEY = required('SUPABASE_SECRET_KEY');
const TARGET = env.description;
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Fork-Demo-2025!';
// Auth is one schema per stack, shared by the dev and e2e databases, so each
// seeds its own user (.env.e2e sets e2e@fork.local) and only that one is replaced.
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? 'spencer@fork.dev';
// The second cook, an accepted friend of the first; same password.
const SEED_USER2_EMAIL = process.env.SEED_USER2_EMAIL ?? 'dev@fork.dev';
// The third, who has sent the first a friend request; same password.
const SEED_USER3_EMAIL = process.env.SEED_USER3_EMAIL ?? 'priya@fork.dev';

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
			// The save's own types and cap: the bucket is a backstop, never a different rule.
			allowedMimeTypes: [...PHOTO_TYPES],
			fileSizeLimit: PHOTO_MAX_BYTES
		});
		console.log('Created recipe-images bucket');
	}

	// ── Seed logins, before anything is deleted ──────────────────────────────
	// Every way the run can fail outside the data (Auth unreachable, a login
	// refused) fails here, while the database is untouched. A login that already
	// exists is kept, its password reset, so a rerun after any failure finishes.
	const existing = await allAuthUsers(async (page, perPage) => {
		const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
		if (error) throw new Error(`Could not list Auth users: ${error.message}`);
		return data.users;
	});
	const idByEmail = new Map(existing.map((u) => [u.email?.toLowerCase(), u.id]));
	async function seedLogin(email: string): Promise<string> {
		const id = idByEmail.get(email.toLowerCase());
		if (id) {
			const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
				password: SEED_USER_PASSWORD
			});
			if (error) throw new Error(`Failed to update seed user ${email}: ${error.message}`);
			return id;
		}
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: SEED_USER_PASSWORD,
			email_confirm: true
		});
		if (error || !data.user) throw new Error(`Failed to create seed user: ${error?.message}`);
		return data.user.id;
	}
	const userIds: Record<SeedUsername, string> = {
		spencerfletcher: await seedLogin(SEED_USER_EMAIL),
		devcooks: await seedLogin(SEED_USER2_EMAIL),
		priyabakes: await seedLogin(SEED_USER3_EMAIL)
	};

	// ── The database, in one transaction: a failure leaves it as it was ─────
	await db.transaction(async (tx) => {
		// ── Wipe existing seed data ──────────────────────────────────────────────
		console.log('Clearing existing data...');
		await tx.delete(recipesToTags);
		await tx.delete(recipeVersions);
		await tx.delete(recipes);
		// These outlive their profile (owner set null), so the cascade no longer clears them.
		await tx.delete(formerUsernames);
		await tx.delete(reports);
		await tx.delete(profiles);

		await tx.insert(profiles).values(
			(Object.keys(userIds) as SeedUsername[]).map((username) => ({
				id: userIds[username],
				username
			}))
		);
		await tx.insert(friendships).values([
			{
				requesterId: userIds.devcooks,
				addresseeId: userIds.spencerfletcher,
				status: 'accepted',
				acceptedAt: new Date()
			},
			{
				requesterId: userIds.priyabakes,
				addresseeId: userIds.spencerfletcher,
				status: 'pending',
				createdAt: new Date('2026-11-07T12:00:00Z')
			}
		]);

		// ── Seed tags ─────────────────────────────────────────────────────────────
		console.log('Seeding tags...');
		const tagRows = await tx
			.insert(tags)
			.values(
				[
					'Dessert',
					'Baking',
					'American',
					'Dinner',
					'Indian',
					'Spicy',
					// Deliberately orphaned — attached to no recipe below. Exercises the
					// search loader's innerJoin, which hides tags with zero recipes.
					'Unused'
				].map((name) => ({ name, slug: slugify(name) }))
			)
			// The incoming slug wins, so a reseed repairs a tag stored with a bad one.
			.onConflictDoUpdate({ target: tags.name, set: { slug: sql`excluded.slug` } })
			.returning({ id: tags.id, name: tags.name });

		const tagId = (name: string) => tagRows.find((t) => t.name === name)!.id;

		// ── Recipes ──────────────────────────────────────────────────────────────
		const idBySlug = new Map<string, number>();
		// Each recipe's version ids, oldest first, for the Journal's links.
		const versionIdsBySlug = new Map<string, number[]>();
		for (const recipe of SEED) {
			const latest = recipe.versions.at(-1)!;
			const userId = userIds[recipe.author ?? 'spencerfletcher'];
			console.log(`Seeding ${latest.title}...`);
			const [row] = await tx
				.insert(recipes)
				.values({
					authorId: userId,
					slug: `${recipe.slug}-${randomSuffix()}`,
					// Copies of the latest version, per the ownership rule in schema.ts.
					...recipeCopies(latest),
					visibility: recipe.visibility,
					parentId: recipe.forkOf ? idBySlug.get(recipe.forkOf.slug) : null,
					parentVersion: recipe.forkOf?.version ?? null,
					// Dated like its versions, so Recent and the feed order the seed the
					// way real data would, not by insert order.
					createdAt: new Date(recipe.versions[0].createdAt),
					updatedAt: new Date(latest.createdAt)
				})
				.returning({ id: recipes.id });
			idBySlug.set(recipe.slug, row.id);

			await tx
				.insert(recipesToTags)
				.values(recipe.tags.map((name) => ({ recipeId: row.id, tagId: tagId(name) })));

			const versionRows = await tx
				.insert(recipeVersions)
				.values(
					recipe.versions.map(({ createdAt, ingredientsText, stepsText, ...version }, i) => ({
						...version,
						ingredients: parseIngredientText(ingredientsText),
						steps: parseStepText(stepsText),
						recipeId: row.id,
						versionNumber: i + 1,
						createdBy: userId,
						createdAt: new Date(createdAt)
					}))
				)
				.returning({ id: recipeVersions.id, versionNumber: recipeVersions.versionNumber });
			versionIdsBySlug.set(
				recipe.slug,
				versionRows.sort((a, b) => a.versionNumber - b.versionNumber).map((v) => v.id)
			);
		}

		// ── Collections ──────────────────────────────────────────────────────────
		// The first cook's starters already made and filled, plus one of their own;
		// the others get theirs when they first open the Cookbook.
		console.log('Seeding collections...');
		await tx
			.update(profiles)
			.set({ startersMadeAt: new Date() })
			.where(eq(profiles.id, userIds.spencerfletcher));
		const shelves = await tx
			.insert(collections)
			.values(
				['To cook', 'Favorites', 'Weeknight'].map((name) => ({
					ownerId: userIds.spencerfletcher,
					name
				}))
			)
			.returning({ id: collections.id, name: collections.name });
		const shelf = (name: string) => shelves.find((c) => c.name === name)!.id;
		await tx.insert(collectionRecipes).values([
			{ collectionId: shelf('To cook'), recipeId: idBySlug.get('chicken-tikka-masala')! },
			{ collectionId: shelf('To cook'), recipeId: idBySlug.get('red-lentil-dal')! },
			{
				collectionId: shelf('Favorites'),
				recipeId: idBySlug.get('classic-chocolate-chip-cookies')!
			},
			{ collectionId: shelf('Weeknight'), recipeId: idBySlug.get('red-lentil-dal')! }
		]);

		// ── Journal ──────────────────────────────────────────────────────────────
		console.log('Seeding log entries...');
		const entryRows = await tx
			.insert(logEntries)
			.values(
				SEED_LOG.map(({ user, recipe, version, createdAt, ...entry }) => {
					const versionIds = recipe ? versionIdsBySlug.get(recipe)! : [];
					return {
						...entry,
						userId: userIds[user],
						recipeId: recipe ? idBySlug.get(recipe)! : null,
						versionId: recipe ? versionIds[(version ?? versionIds.length) - 1] : null,
						createdAt: new Date(createdAt)
					};
				})
			)
			.returning({ id: logEntries.id, userId: logEntries.userId, dish: logEntries.dish });
		// spencerfletcher has liked devcooks' Shakshuka, so the feed shows a count.
		const shakshuka = entryRows.find(
			(e) => e.userId === userIds.devcooks && e.dish === 'Shakshuka'
		)!;
		await tx.insert(likes).values({ userId: userIds.spencerfletcher, logEntryId: shakshuka.id });
	});

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
