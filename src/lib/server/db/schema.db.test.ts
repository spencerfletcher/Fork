import { describe, test, expect, beforeAll } from 'vitest';

try {
	process.loadEnvFile('.env.local');
} catch {
	// CI has no .env.local; it sets the variables itself.
}
const local = process.env.DATABASE_URL?.includes('127.0.0.1') ?? false;

// Runs only against the local Supabase stack, inside a transaction that is
// always rolled back, so it leaves no row behind.
describe.skipIf(!local)('tags, against the real database', () => {
	let db: typeof import('#lib/server/db/index.js').db;
	let tags: typeof import('#lib/server/db/schema.js').tags;

	beforeAll(async () => {
		({ db } = await import('#lib/server/db/index.js'));
		({ tags } = await import('#lib/server/db/schema.js'));
	});

	// Tag pages look slugs up lowercased, so a stored capital makes a tag
	// unreachable (the hosted Baking tag was stored as "Baking").
	test('the database refuses a slug with a capital letter, whoever writes it', async () => {
		const name = `Slug check ${Date.now()}`;
		const error = await db
			.transaction(async (tx) => {
				await tx.insert(tags).values({ name, slug: name.replaceAll(' ', '-') });
				tx.rollback();
			})
			.catch((e: unknown) => e);
		const cause = error instanceof Error ? (error.cause ?? error) : error;
		expect(String(cause)).toContain('tags_slug_lowercase');
	});
});
