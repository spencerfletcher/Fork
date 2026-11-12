// The base seed, the one the e2e suite asserts on: three cooks, six recipes,
// their Journal and a friendship each way. Written inside the seed's
// transaction (seed.ts), after the wipe; the varied set (load.ts) builds on it.
import { eq, sql } from 'drizzle-orm';
import type { Tx } from '../index.js';
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
} from '../schema.js';
import { slugify, randomSuffix } from '../../../helpers.js';
import { recipeCopies } from '../../../recipes/content.js';
import { parseIngredientText } from '../../../recipes/ingredients.js';
import { parseStepText } from '../../../recipes/steps.js';
import { SEED, SEED_LOG, type SeedUsername } from '../seedData.js';

/** Every seeded table emptied; what the profile cascade does not reach, by hand. */
export async function wipe(tx: Tx): Promise<void> {
	// ── Wipe existing seed data ──────────────────────────────────────────────
	console.log('Clearing existing data...');
	await tx.delete(recipesToTags);
	await tx.delete(recipeVersions);
	await tx.delete(recipes);
	// These outlive their profile (owner set null), so the cascade no longer clears them.
	await tx.delete(formerUsernames);
	await tx.delete(reports);
	await tx.delete(profiles);
}

/** The base cooks' rows, ids, slugs and version ids, for the varied set to name. */
export type BaseIds = {
	userIds: Record<SeedUsername, string>;
	idBySlug: Map<string, number>;
	versionIdsBySlug: Map<string, number[]>;
};

/** The base seed, for cooks whose logins have these ids. */
export async function loadBase(tx: Tx, userIds: Record<SeedUsername, string>): Promise<BaseIds> {
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
				updatedAt: new Date(latest.createdAt),
				// One committed save per version after the first, as the editor counts them.
				editRevision: recipe.versions.length - 1
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
	const shakshuka = entryRows.find((e) => e.userId === userIds.devcooks && e.dish === 'Shakshuka')!;
	await tx.insert(likes).values({ userId: userIds.spencerfletcher, logEntryId: shakshuka.id });

	return { userIds, idBySlug, versionIdsBySlug };
}
