// The varied seed: about thirty more cooks, their recipes with versions and
// forks, and the social state around them, written on top of the base inside
// the seed's transaction. Rows go in as the app's own write paths leave them:
// the recipe row copies its latest version, the content is what the editor's
// parser stores, tags come from tagIdsFor, kept copies from grantKeptCopies,
// the Trash from moveToTrash, collections from createCollection and
// setMembership. Only the dates are the seed's own, counted back from `today`.
import { createHash } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import type { Tx } from '../index.js';
import {
	collections,
	favorites,
	formerUsernames,
	friendships,
	likes,
	logEntries,
	mutes,
	profiles,
	recipes,
	recipesToTags,
	recipeVersions,
	reports
} from '../schema.js';
import { tagIdsFor } from '../../tags.js';
import { grantKeptCopies } from '../../keptCopies.js';
import { moveToTrash } from '../../trash.js';
import { createCollection, setMembership } from '../../collections.js';
import { withContact } from '../../moderation.js';
import { canView } from '../../visibility.js';
import { recipeCopies } from '../../../recipes/content.js';
import { NOTE_MAX } from '../../../saves.js';
import { STARTER_COLLECTIONS } from '../../../collections.js';
import { SEED } from '../seedData.js';
import type { BaseIds } from './base.js';
import { baseAsVaried, storedContent, versionsOf, type BuiltVersion } from './build.js';
import { VARIED_COOKS } from './cooks.js';
import { VARIED_RECIPES } from './recipes.js';
import { COLLECTIONS, ENTRIES, FRIENDSHIPS, MUTES, PROFILES, REPORTS, SAVES } from './social.js';
import type { Cook, VariedRecipe } from './types.js';

/** A varied recipe's slug: its key and a suffix from it, so a reseed keeps every link. */
export const seedSlug = (key: string) =>
	`${key}-${createHash('sha256').update(key).digest('hex').slice(0, 8)}`;

type Loaded = { id: number; recipe: VariedRecipe; versions: BuiltVersion[]; versionIds: number[] };

export async function loadVaried(
	tx: Tx,
	ids: Record<Cook, string>,
	base: BaseIds,
	today: Date
): Promise<void> {
	// Noon on the day `days` before the run, so a day count reads as that calendar day anywhere in the Americas and Europe.
	const runDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
	const at = (days: number) => new Date(runDay - days * 86_400_000);
	const fail = (what: string): never => {
		throw new Error(`Varied seed: ${what}`);
	};

	// ── Cooks ────────────────────────────────────────────────────────────────
	console.log(`Seeding ${VARIED_COOKS.length} more cooks...`);
	await tx.insert(profiles).values(VARIED_COOKS.map((cook) => ({ id: ids[cook], username: cook })));
	for (const p of PROFILES) {
		if (
			p.measurement ||
			p.defaultVisibility ||
			p.muted ||
			p.seenDaysAgo !== undefined ||
			p.startersDaysAgo !== undefined
		)
			await tx
				.update(profiles)
				.set({
					measurement: p.measurement,
					defaultVisibility: p.defaultVisibility,
					mutedNotifications: p.muted,
					notificationsSeenAt: p.seenDaysAgo === undefined ? undefined : at(p.seenDaysAgo),
					startersMadeAt: p.startersDaysAgo === undefined ? undefined : at(p.startersDaysAgo)
				})
				.where(eq(profiles.id, ids[p.cook]));
		if (p.startersDaysAgo !== undefined && p.cook !== 'spencerfletcher')
			await tx
				.insert(collections)
				.values(STARTER_COLLECTIONS.map((name) => ({ ownerId: ids[p.cook], name })));
		for (const f of p.former ?? [])
			await tx
				.insert(formerUsernames)
				.values({ username: f.username, profileId: ids[p.cook], createdAt: at(f.daysAgo) });
	}

	// ── Friendships, blocks and mutes ────────────────────────────────────────
	await tx.insert(friendships).values(
		FRIENDSHIPS.map((f) => ({
			requesterId: ids[f.from],
			addresseeId: ids[f.to],
			status: f.status,
			createdAt: at(f.daysAgo),
			acceptedAt: f.acceptedDaysAgo === undefined ? null : at(f.acceptedDaysAgo)
		}))
	);
	await tx
		.insert(mutes)
		.values(
			MUTES.map((m) => ({ muterId: ids[m.muter], mutedId: ids[m.muted], createdAt: at(m.daysAgo) }))
		);
	const accepted = FRIENDSHIPS.filter((f) => f.status === 'accepted');
	const friendsOf = (cook: Cook) =>
		accepted.flatMap((f) => (f.from === cook ? [ids[f.to]] : f.to === cook ? [ids[f.from]] : []));

	// ── Recipes, parents before forks ────────────────────────────────────────
	const all = [...baseAsVaried(SEED, today), ...VARIED_RECIPES];
	const byKey = new Map(all.map((r) => [r.key, r]));
	const loaded = new Map<string, Loaded>();
	for (const [slug, id] of base.idBySlug) {
		const recipe = byKey.get(slug)!;
		loaded.set(slug, {
			id,
			recipe,
			versions: versionsOf(recipe, byKey),
			versionIds: base.versionIdsBySlug.get(slug)!
		});
	}
	const pending = [...VARIED_RECIPES];
	console.log(`Seeding ${pending.length} more recipes...`);
	while (pending.length > 0) {
		const i = pending.findIndex((r) => !r.forkOf || loaded.has(r.forkOf.key));
		if (i === -1) fail(`no parent for ${pending.map((r) => r.key).join(', ')}`);
		const [recipe] = pending.splice(i, 1);
		loaded.set(recipe.key, await insertRecipe(recipe));
	}

	async function insertRecipe(recipe: VariedRecipe): Promise<Loaded> {
		const versions = versionsOf(recipe, byKey);
		const stored = versions.map((v) => storedContent(v.content));
		const latest = stored.at(-1)!;
		const authorId = ids[recipe.author];
		const parent = recipe.forkOf ? loaded.get(recipe.forkOf.key)! : null;
		// Each settings save on its own bumps the revision too: the tags, a fork
		// widened from private with no version to carry it, a withdrawal.
		const settingsSaves =
			(recipe.tagsEditedDaysAgo === undefined ? 0 : 1) +
			(recipe.forkOf && versions.length === 1 && recipe.visibility !== 'private' ? 1 : 0) +
			(recipe.withdrawn ? 1 : 0);
		const lastSave = Math.min(versions.at(-1)!.daysAgo, recipe.withdrawn?.daysAgo ?? Infinity);
		const [row] = await tx
			.insert(recipes)
			.values({
				authorId,
				slug: seedSlug(recipe.key),
				...recipeCopies(latest),
				// A withdrawn recipe had its audience until then (see below).
				visibility: recipe.withdrawn?.from ?? recipe.visibility,
				parentId: parent?.id ?? null,
				parentVersion: recipe.forkOf?.version ?? null,
				createdAt: at(recipe.daysAgo),
				updatedAt: at(lastSave),
				editRevision: versions.length - 1 + settingsSaves
			})
			.returning({ id: recipes.id });
		const tagIds = await tagIdsFor(tx, recipe.tags);
		if (tagIds.length > 0)
			await tx.insert(recipesToTags).values(tagIds.map((tagId) => ({ recipeId: row.id, tagId })));
		const versionRows = await tx
			.insert(recipeVersions)
			.values(
				stored.map((content, n) => ({
					...content,
					recipeId: row.id,
					versionNumber: n + 1,
					commitMessage: versions[n].message,
					createdBy: authorId,
					createdAt: at(versions[n].daysAgo)
				}))
			)
			.returning({ id: recipeVersions.id, versionNumber: recipeVersions.versionNumber });
		const versionIds = versionRows
			.sort((a, b) => a.versionNumber - b.versionNumber)
			.map((v) => v.id);
		return { id: row.id, recipe, versions, versionIds };
	}

	const recipeOf = (key: string) => loaded.get(key) ?? fail(`no recipe ${key}`);

	// ── Saves, while every recipe still has the audience it had ──────────────
	console.log(`Seeding ${SAVES.length} saves...`);
	for (const save of SAVES) {
		const { id, recipe, versions } = recipeOf(save.recipe);
		const userId = ids[save.cook];
		const audience = recipe.withdrawn?.from ?? recipe.visibility;
		const row = {
			authorId: ids[recipe.author],
			visibility: audience,
			deletedAt: null,
			suppressedAt: null
		};
		if (!canView(row, { id: userId }, friendsOf(save.cook)) || userId === row.authorId)
			fail(`${save.cook} cannot save ${save.recipe}`);
		if (save.daysAgo > recipe.daysAgo) fail(`${save.cook} saves ${save.recipe} before it exists`);
		for (const later of [recipe.withdrawn?.daysAgo, recipe.trashedDaysAgo, recipe.hiddenDaysAgo])
			if (later !== undefined && save.daysAgo <= later)
				fail(`${save.cook} saves ${save.recipe} after it was withdrawn`);
		if (save.keep !== undefined && !versions[save.keep - 1])
			fail(`${save.cook} keeps a missing version of ${save.recipe}`);
		if (save.note && [...save.note].length > NOTE_MAX) fail(`${save.cook}'s note is too long`);
		await tx.insert(favorites).values({
			userId,
			recipeId: id,
			createdAt: at(save.daysAgo),
			keptVersion: save.keep ?? null,
			note: save.note ?? null
		});
	}

	// ── Collections, filled the way the picker fills them ────────────────────
	console.log(`Seeding ${COLLECTIONS.length} collections...`);
	for (const c of COLLECTIONS) {
		const owner = { id: ids[c.cook] };
		// The starters (and the base's Weeknight) exist already; any other is made.
		const [existing] = await tx
			.select({ id: collections.id })
			.from(collections)
			.where(and(eq(collections.ownerId, owner.id), eq(collections.name, c.name)));
		const created = existing ?? (await createCollection(owner.id, c.name, tx));
		const made = 'error' in created ? fail(`${c.cook}'s ${c.name}: ${created.error}`) : created;
		for (const key of c.recipes)
			if (!(await setMembership(owner, made.id, recipeOf(key).id, true, tx)))
				fail(`${key} is not in ${c.cook}'s library for ${c.name}`);
	}

	// ── What happened to some recipes after: private, the Trash, hidden ─────
	for (const { id, recipe } of loaded.values()) {
		if (recipe.withdrawn) {
			const authorId = ids[recipe.author];
			await grantKeptCopies(tx, { id, authorId, visibility: recipe.withdrawn.from });
			await tx.update(recipes).set({ visibility: 'private' }).where(eq(recipes.id, id));
		}
		if (recipe.trashedDaysAgo !== undefined) {
			await moveToTrash({ id, authorId: ids[recipe.author] }, tx);
			await tx
				.update(recipes)
				.set({ deletedAt: at(recipe.trashedDaysAgo) })
				.where(eq(recipes.id, id));
		}
		if (recipe.hiddenDaysAgo !== undefined)
			await tx
				.update(recipes)
				.set({ suppressedAt: at(recipe.hiddenDaysAgo) })
				.where(eq(recipes.id, id));
	}

	// ── The Journal ──────────────────────────────────────────────────────────
	console.log(`Seeding ${ENTRIES.length} Journal entries...`);
	const entryIds = new Map<string, number>();
	for (const e of ENTRIES) {
		const source = e.recipe === undefined ? null : recipeOf(e.recipe);
		const n = e.version ?? source?.versions.filter((v) => v.daysAgo >= e.daysAgo).length;
		if (source && (n === undefined || !source.versions[n - 1]))
			fail(`${e.cook} cooks a missing version of ${e.recipe}`);
		if (source && source.versions[n! - 1].daysAgo < e.daysAgo)
			fail(`${e.cook} cooks ${e.recipe} v${n} before it was written`);
		const [entry] = await tx
			.insert(logEntries)
			.values({
				userId: ids[e.cook],
				recipeId: source?.id ?? null,
				versionId: source ? source.versionIds[n! - 1] : null,
				dish: e.dish,
				cookedOn: at(e.daysAgo).toISOString().slice(0, 10),
				servings: e.servings,
				photoUrl: null,
				sourceUrl: e.sourceUrl ?? null,
				caption: e.caption,
				note: e.note,
				audience: e.audience,
				createdAt: new Date(at(e.daysAgo).getTime() + 8 * 3_600_000)
			})
			.returning({ id: logEntries.id });
		entryIds.set(`${e.cook}:${e.dish}`, entry.id);
		for (const like of e.likedBy ?? []) {
			const sees =
				like.cook === e.cook ||
				(e.audience === 'friends' && friendsOf(e.cook).includes(ids[like.cook]));
			if (!sees || like.daysAgo > e.daysAgo) fail(`${like.cook} cannot like ${e.cook}'s ${e.dish}`);
			await tx
				.insert(likes)
				.values({ userId: ids[like.cook], logEntryId: entry.id, createdAt: at(like.daysAgo) });
		}
	}

	// ── Reports, one of each kind and more for the hidden recipe ─────────────
	await tx.insert(reports).values(
		REPORTS.map((r) => {
			const reporterId = r.by === null ? null : ids[r.by];
			const createdAt = at(r.daysAgo);
			switch (r.target) {
				case 'recipe':
					return {
						reporterId,
						createdAt,
						targetType: r.target,
						targetId: String(recipeOf(r.recipe).id),
						reason: r.reason
					};
				case 'user':
					return {
						reporterId,
						createdAt,
						targetType: r.target,
						targetId: ids[r.cook],
						reason: r.reason
					};
				case 'log_entry': {
					const entry = entryIds.get(`${r.entryOf}:${r.dish}`) ?? fail(`no entry ${r.dish}`);
					return {
						reporterId,
						createdAt,
						targetType: r.target,
						targetId: String(entry),
						reason: r.reason
					};
				}
				case 'link': {
					const path = typeof r.path === 'string' ? r.path : `/recipes/${seedSlug(r.path.recipe)}`;
					return {
						reporterId,
						createdAt,
						targetType: r.target,
						targetId: path,
						reason: withContact(r.contact, r.reason)
					};
				}
			}
		})
	);

	// The varied set's recipe ids, for a check that every one went in.
	const seeded = await tx
		.select({ id: recipes.id })
		.from(recipes)
		.where(
			inArray(
				recipes.slug,
				VARIED_RECIPES.map((r) => seedSlug(r.key))
			)
		);
	if (seeded.length !== VARIED_RECIPES.length) fail('a recipe is missing');
}
