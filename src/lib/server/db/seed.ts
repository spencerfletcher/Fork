import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { db, closeDb } from './index';
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '#lib/recipes/validation.js';
import type { SeedUsername } from './seedData';
import { loadEnv, required, targetFromEnv } from './env';
import { loadsVaried, printedPassword, seedPassword } from './target';
import { allAuthUsers } from './seedAuth';
import { loadBase, wipe } from './seed/base';
import { loadVaried } from './seed/load';
import { VARIED_COOKS, seededEmail, type VariedCook } from './seed/cooks';

// `pnpm db:seed` targets the local stack, `pnpm db:seed:e2e` the suite's fork_e2e
// and `pnpm db:seed:prod` the hosted project; loadEnv refuses a mix of local and hosted before anything is deleted.
// Run through scripts/app-env.ts, so the app's db and write-path helpers load, on one connection.
const target = targetFromEnv();
const env = loadEnv(target);
const SUPABASE_URL = env.SUPABASE_URL;
// Only the seed needs the secret key (it creates the seed user); migrate and drizzle-kit run without it.
const SUPABASE_SECRET_KEY = required('SUPABASE_SECRET_KEY');
const TARGET = env.description;
// Refuses a hosted target without a password of its own, before any Auth call or delete.
const SEED_USER_PASSWORD = seedPassword(target, process.env.SEED_USER_PASSWORD);
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
	/**
	 * The login for `email`, made when missing. A base cook's password is reset
	 * to the shared one; an invented cook's (`password` null) is left alone, and
	 * a new one gets a random password that is never stored or printed, so
	 * nobody can sign in as them.
	 */
	async function seedLogin(email: string, password: string | null = SEED_USER_PASSWORD) {
		const id = idByEmail.get(email.toLowerCase());
		if (id) {
			if (password === null) return id;
			const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
			if (error) throw new Error(`Failed to update seed user ${email}: ${error.message}`);
			return id;
		}
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: password ?? randomBytes(32).toString('base64url'),
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
	// One at a time: Auth's admin API is rate-limited on the hosted project.
	const variedIds = {} as Record<VariedCook, string>;
	if (loadsVaried(target)) {
		console.log(`Checking ${VARIED_COOKS.length} invented cooks' logins...`);
		for (const cook of VARIED_COOKS) variedIds[cook] = await seedLogin(seededEmail(cook), null);
	}

	// ── The database, in one transaction: a failure leaves it as it was ─────
	await db.transaction(async (tx) => {
		await wipe(tx);
		const base = await loadBase(tx, userIds);
		if (loadsVaried(target)) await loadVaried(tx, { ...userIds, ...variedIds }, base, new Date());
	});

	console.log('✅ Seeding complete.');
	console.log(
		`\nSeed user credentials:\n  Email: ${SEED_USER_EMAIL}\n  Password: ${printedPassword(target, SEED_USER_PASSWORD)}`
	);

	await closeDb();
}

seed().catch((err) => {
	console.error('Error during seeding:', err);
	process.exit(1);
});
