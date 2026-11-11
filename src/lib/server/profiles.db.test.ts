import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { and, eq, sql } from 'drizzle-orm';

import { inRollback, localDb } from '#lib/testing/db.js';
import { FORMER_USERNAME_DAYS, USERNAME_CHANGES_PER_WINDOW } from '#lib/auth/rules.js';

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

	const CHANGED = { result: 'changed' };
	const TAKEN = { result: 'taken' };

	/** Moves a former name's start to the window's edge, `hours` past it (negative: still inside). */
	const backdate = (tx: Tx, username: string, hours: number) =>
		tx
			.update(schema.formerUsernames)
			.set({
				createdAt: sql`now() - make_interval(days => ${FORMER_USERNAME_DAYS}::int, hours => ${hours}::int)`
			})
			.where(eq(schema.formerUsernames.username, username));

	const formerOf = async (tx: Tx, id: string) =>
		(
			await tx
				.select({ username: schema.formerUsernames.username })
				.from(schema.formerUsernames)
				.where(eq(schema.formerUsernames.profileId, id))
		)
			.map((r) => r.username)
			.sort();

	test('a rename keeps the profile and its id; the old name points at it', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			expect(await profiles.changeUsername(a, `a2-${stamp}`, tx)).toEqual(CHANGED);

			expect(await nameOf(tx, a)).toBe(`a2-${stamp}`);
			expect((await named(tx, `a-${stamp}`))?.id).toBe(a);
			expect((await named(tx, `a2-${stamp}`))?.id).toBe(a);
		});
	});

	test("nobody else may take someone's current or former name", async () => {
		await withTwo(async (tx, a, b, stamp) => {
			expect(await profiles.changeUsername(b, `a-${stamp}`, tx)).toEqual(TAKEN);

			await profiles.changeUsername(a, `a2-${stamp}`, tx);
			expect(await profiles.changeUsername(b, `a-${stamp}`, tx)).toEqual(TAKEN);
			expect(await profiles.usernameTaken(`a-${stamp}`, undefined, tx)).toBe(true);
			expect(await nameOf(tx, b)).toBe(`b-${stamp}`);
		});
	});

	test('the owner may take a former name back, which frees the reservation of that name only', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			await profiles.changeUsername(a, `a2-${stamp}`, tx);
			expect(await profiles.usernameTaken(`a-${stamp}`, a, tx)).toBe(false);

			expect(await profiles.changeUsername(a, `a-${stamp}`, tx)).toEqual(CHANGED);
			expect(await nameOf(tx, a)).toBe(`a-${stamp}`);
			const former = await tx
				.select({ username: schema.formerUsernames.username })
				.from(schema.formerUsernames)
				.where(eq(schema.formerUsernames.profileId, a));
			expect(former).toEqual([{ username: `a2-${stamp}` }]);
		});
	});

	test(`a former name points at its owner and stays reserved for ${FORMER_USERNAME_DAYS} days, then neither`, async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			await profiles.changeUsername(a, `a2-${stamp}`, tx);

			await backdate(tx, `a-${stamp}`, -1);
			expect((await named(tx, `a-${stamp}`))?.id).toBe(a);
			expect(await profiles.usernameTaken(`a-${stamp}`, undefined, tx)).toBe(true);

			await backdate(tx, `a-${stamp}`, 1);
			expect(await named(tx, `a-${stamp}`)).toBeUndefined();
			expect(await profiles.usernameTaken(`a-${stamp}`, undefined, tx)).toBe(false);
			expect((await named(tx, `a2-${stamp}`))?.id).toBe(a);
		});
	});

	test('another cook may take an expired name, and the expired row goes in the same change', async () => {
		await withTwo(async (tx, a, b, stamp) => {
			await profiles.changeUsername(a, `a2-${stamp}`, tx);
			await backdate(tx, `a-${stamp}`, 1);

			expect(await profiles.changeUsername(b, `a-${stamp}`, tx)).toEqual(CHANGED);
			expect((await named(tx, `a-${stamp}`))?.id).toBe(b);
			expect(await formerOf(tx, a)).toEqual([]);
			// B can give it up in turn: no stale row holds the key.
			expect(await profiles.changeUsername(b, `b3-${stamp}`, tx)).toEqual(CHANGED);
			expect(await formerOf(tx, b)).toEqual([`a-${stamp}`, `b-${stamp}`].sort());
		});
	});

	test(`at most ${USERNAME_CHANGES_PER_WINDOW} changes in the window; the refusal says when the next one is allowed`, async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			for (let n = 1; n <= USERNAME_CHANGES_PER_WINDOW; n++) {
				expect(await profiles.changeUsername(a, `a${n}-${stamp}`, tx)).toEqual(CHANGED);
			}
			const [oldest] = await tx
				.select({ createdAt: schema.formerUsernames.createdAt })
				.from(schema.formerUsernames)
				.where(
					and(
						eq(schema.formerUsernames.profileId, a),
						eq(schema.formerUsernames.username, `a-${stamp}`)
					)
				);

			const refused = await profiles.changeUsername(a, `new-${stamp}`, tx);
			expect(refused).toEqual({
				result: 'too_soon',
				nextChange: new Date(oldest.createdAt.getTime() + FORMER_USERNAME_DAYS * 86_400_000)
			});
			expect(await nameOf(tx, a)).toBe(`a${USERNAME_CHANGES_PER_WINDOW}-${stamp}`);

			// Once the oldest change leaves the window, one more is allowed.
			await backdate(tx, `a-${stamp}`, 1);
			expect(await profiles.changeUsername(a, `new-${stamp}`, tx)).toEqual(CHANGED);
		});
	});

	test('taking an own former name back is allowed at the limit', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			for (let n = 1; n <= USERNAME_CHANGES_PER_WINDOW; n++) {
				await profiles.changeUsername(a, `a${n}-${stamp}`, tx);
			}
			expect(await profiles.changeUsername(a, `a-${stamp}`, tx)).toEqual(CHANGED);
			expect(await nameOf(tx, a)).toBe(`a-${stamp}`);
		});
	});

	test('undo cannot be used to cycle through new names: each new name still counts', async () => {
		await withTwo(async (tx, a, _b, stamp) => {
			// A→B, B→A, A→C, C→A: two new names, so a third is refused.
			const [A, B, C, D] = ['a', 'b2', 'c', 'd'].map((n) => `${n}-${stamp}`);
			expect(await profiles.changeUsername(a, B, tx)).toEqual(CHANGED);
			expect(await profiles.changeUsername(a, A, tx)).toEqual(CHANGED);
			expect(await profiles.changeUsername(a, C, tx)).toEqual(CHANGED);
			expect(await profiles.changeUsername(a, A, tx)).toEqual(CHANGED);
			expect(await profiles.changeUsername(a, D, tx)).toMatchObject({ result: 'too_soon' });
			expect(await nameOf(tx, a)).toBe(A);
			// The names given up stay reserved and still redirect.
			expect(await formerOf(tx, a)).toEqual([B, C].sort());
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
			expect(await profiles.changeUsername(a, `a-${stamp}`, tx)).toEqual(CHANGED);
			const former = await tx
				.select()
				.from(schema.formerUsernames)
				.where(eq(schema.formerUsernames.profileId, a));
			expect(former).toEqual([]);
		});
	});
});
