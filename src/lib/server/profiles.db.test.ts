import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';

afterAll(async () => {
	if (localDb) await (await import('#lib/server/db/index.js')).closeDb();
});

// Runs only against the local Supabase stack, each test inside a transaction
// that is always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('username changes, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let profiles: typeof import('./profiles.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		profiles = await import('./profiles.js');
	});

	type Tx = import('./db/index.js').Tx;

	/** Two fresh profiles, A and B, with names `a-<stamp>` and `b-<stamp>`; rolled back after. */
	async function withTwo(body: (tx: Tx, a: string, b: string, stamp: string) => Promise<void>) {
		const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		await inRollback(async (tx) => {
			await tx.insert(schema.profiles).values([
				{ id: `test-a-${stamp}`, username: `a-${stamp}` },
				{ id: `test-b-${stamp}`, username: `b-${stamp}` }
			]);
			await body(tx, `test-a-${stamp}`, `test-b-${stamp}`, stamp);
		});
	}

	const nameOf = async (tx: Tx, id: string) =>
		(await tx.query.profiles.findFirst({ where: eq(schema.profiles.id, id) }))?.username;

	const named = (tx: Tx, username: string) =>
		tx.query.profiles.findFirst({ where: profiles.namedBy(username) });

	test('a rename keeps the profile and its id; the old name points at it', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			expect(await profiles.changeUsername(a, `a2-${stamp}`, tx)).toBe(true);

			expect(await nameOf(tx, a)).toBe(`a2-${stamp}`);
			expect((await named(tx, `a-${stamp}`))?.id).toBe(a);
			expect((await named(tx, `a2-${stamp}`))?.id).toBe(a);
		});
	});

	test("nobody else may take someone's current or former name", async () => {
		await withTwo(async (tx, a, b, stamp) => {
			expect(await profiles.changeUsername(b, `a-${stamp}`, tx)).toBe(false);

			await profiles.changeUsername(a, `a2-${stamp}`, tx);
			expect(await profiles.changeUsername(b, `a-${stamp}`, tx)).toBe(false);
			expect(await profiles.usernameTaken(`a-${stamp}`, undefined, tx)).toBe(true);
			expect(await nameOf(tx, b)).toBe(`b-${stamp}`);
		});
	});

	test('the owner may take a former name back, which frees the reservation of that name only', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			await profiles.changeUsername(a, `a2-${stamp}`, tx);
			expect(await profiles.usernameTaken(`a-${stamp}`, a, tx)).toBe(false);

			expect(await profiles.changeUsername(a, `a-${stamp}`, tx)).toBe(true);
			expect(await nameOf(tx, a)).toBe(`a-${stamp}`);
			const former = await tx
				.select({ username: schema.formerUsernames.username })
				.from(schema.formerUsernames)
				.where(eq(schema.formerUsernames.profileId, a));
			expect(former).toEqual([{ username: `a2-${stamp}` }]);
		});
	});

	test('the table refuses a second owner for one former name', async () => {
		await withTwo(async (tx, a, b, stamp) => {
			await tx.insert(schema.formerUsernames).values({ username: `old-${stamp}`, profileId: a });
			await expect(
				tx.insert(schema.formerUsernames).values({ username: `old-${stamp}`, profileId: b })
			).rejects.toThrow();
		});
	});

	test('the same name again changes nothing and reserves nothing', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			expect(await profiles.changeUsername(a, `a-${stamp}`, tx)).toBe(true);
			const former = await tx
				.select()
				.from(schema.formerUsernames)
				.where(eq(schema.formerUsernames.profileId, a));
			expect(former).toEqual([]);
		});
	});
});
