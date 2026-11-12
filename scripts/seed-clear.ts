// Removes the varied seed's invented cooks and everything of theirs, and
// nothing else: the logins on SEEDED_EMAIL_DOMAIN (seed/cooks.ts), each
// through deleteAccount, the path Settings' Delete account takes, so their
// recipes leave kept copies and forks as a real deletion would.
//   pnpm db:seed:clear[:prod]            dry run: lists who would go
//   pnpm db:seed:clear[:prod] --apply    deletes them, one at a time
// Env and target guard as the seed's (loadEnv, through scripts/app-env.ts),
// plus SUPABASE_SECRET_KEY for Auth and Storage. Safe to rerun after a failure.
import { createClient } from '@supabase/supabase-js';
import { inArray } from 'drizzle-orm';
import { loadEnv, required, targetFromEnv } from '#lib/server/db/env.js';
import { db, closeDb } from '#lib/server/db/index.js';
import { profiles, recipes } from '#lib/server/db/schema.js';
import { deleteAccount } from '#lib/server/account.js';
import { allAuthUsers } from '#lib/server/db/seedAuth.js';
import { isSeededEmail } from '#lib/server/db/seed/cooks.js';

const apply = process.argv.includes('--apply');
const env = loadEnv(targetFromEnv());
const supabase = createClient(env.SUPABASE_URL, required('SUPABASE_SECRET_KEY'), {
	auth: { autoRefreshToken: false, persistSession: false }
});
console.log(`${apply ? 'Clearing' : 'Dry run against'} ${env.description}`);

const seeded = (
	await allAuthUsers(async (page, perPage) => {
		const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
		if (error) throw new Error(`Could not list Auth users: ${error.message}`);
		return data.users;
	})
).filter((u) => isSeededEmail(u.email));

const ids = seeded.map((u) => u.id);
const names = new Map(
	ids.length === 0
		? []
		: (
				await db
					.select({ id: profiles.id, username: profiles.username })
					.from(profiles)
					.where(inArray(profiles.id, ids))
			).map((p) => [p.id, p.username])
);
const owned = ids.length === 0 ? 0 : await db.$count(recipes, inArray(recipes.authorId, ids));
console.log(
	`${seeded.length} seeded logins, ${names.size} with profiles, ${owned} recipes of theirs.`
);

for (const user of seeded) {
	const who = `${names.get(user.id) ?? '(no profile)'} <${user.email}>`;
	if (!apply) {
		console.log(`would delete ${who}`);
		continue;
	}
	const login = await deleteAccount(user.id, supabase);
	// The app's database role may not reach auth.users (login_kept): Auth's admin API can.
	if (login === 'login_kept') {
		const { error } = await supabase.auth.admin.deleteUser(user.id);
		if (error) throw new Error(`Could not delete the login of ${who}: ${error.message}`);
	}
	console.log(`deleted ${who}`);
}

await closeDb();
if (!apply && seeded.length > 0)
	console.log('Nothing changed. Run again with --apply to delete them.');
