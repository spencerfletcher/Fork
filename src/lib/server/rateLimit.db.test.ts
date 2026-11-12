import { describe, test, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDbAfter, localDb, stamp, withProfiles } from '#lib/testing/db.js';
import { RATE_LIMITS, type RateLimit } from './rateLimit.js';

closeDbAfter();

// Each limit's rows, inserted for real, so the count each limit runs is the one tested.
describe.skipIf(!localDb)('rateLimited, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let rl: typeof import('./rateLimit.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		rl = await import('./rateLimit.js');
	});

	type Tx = import('./db/index.js').Tx;

	/** A moment `hours` ago, give or take a minute, as the transaction's clock reads it. */
	const ago = (hours: number, minutes: number) =>
		sql`now() - make_interval(hours => ${hours}, mins => ${minutes})`;

	/** `n` rows that `name` counts for `who`, made `at`. */
	async function rows(tx: Tx, name: RateLimit, who: string, n: number, at = sql`now()`) {
		if (n === 0) return;
		const s = stamp();
		const each = Array.from({ length: n }, (_, i) => i);
		switch (name) {
			case 'recipes':
				await tx
					.insert(schema.recipes)
					.values(
						each.map((i) => ({ slug: `rl-${s}-${i}`, title: 'R', authorId: who, createdAt: at }))
					);
				return;
			case 'edits': {
				const [r] = await tx
					.insert(schema.recipes)
					.values({ slug: `rl-${s}`, title: 'R' })
					.returning({ id: schema.recipes.id });
				await tx.insert(schema.recipeVersions).values(
					each.map((i) => ({
						recipeId: r.id,
						versionNumber: i + 1,
						commitMessage: 'm',
						title: 'R',
						ingredients: [],
						steps: [],
						createdBy: who,
						createdAt: at
					}))
				);
				return;
			}
			case 'reports':
				await tx.insert(schema.reports).values(
					each.map(() => ({
						reporterId: who,
						targetType: 'recipe' as const,
						targetId: '1',
						reason: 'r',
						createdAt: at
					}))
				);
				return;
			case 'linkReports':
				await tx.insert(schema.reports).values(
					each.map(() => ({
						reporterId: null,
						targetType: 'link' as const,
						targetId: '/',
						reason: 'r',
						createdAt: at
					}))
				);
				return;
			case 'journal':
				await tx
					.insert(schema.logEntries)
					.values(
						each.map(() => ({ userId: who, dish: 'D', cookedOn: '2026-01-01', createdAt: at }))
					);
				return;
			case 'friendRequests': {
				const others = each.map((i) => ({ id: `rl-${s}-${i}`, username: `rl-${s}-${i}` }));
				await tx.insert(schema.profiles).values(others);
				await tx.insert(schema.friendships).values(
					others.map((o) => ({
						requesterId: who,
						addresseeId: o.id,
						status: 'pending' as const,
						createdAt: at
					}))
				);
				return;
			}
			case 'collections':
				await tx
					.insert(schema.collections)
					.values(each.map((i) => ({ ownerId: who, name: `C ${s} ${i}`, createdAt: at })));
				return;
		}
	}

	const names = Object.keys(RATE_LIMITS) as RateLimit[];

	/** The global link-report count would meet the local database's own rows (rolled back after). */
	async function clearGlobal(tx: Tx, name: RateLimit) {
		if (name === 'linkReports') await tx.delete(schema.reports);
	}

	test.each(names)('%s: allows up to its cap, refuses the one past it', async (name) => {
		const { max } = RATE_LIMITS[name];
		await withProfiles(1, async (tx, [cook]) => {
			await clearGlobal(tx, name);
			await rows(tx, name, cook, max - 1);
			expect(await rl.rateLimited(name, cook, tx)).toBeNull();
			await rows(tx, name, cook, 1);
			expect(await rl.rateLimited(name, cook, tx)).toBe(RATE_LIMITS[name].message);
		});
	});

	test.each(names)('%s: rows older than its window do not count', async (name) => {
		const { max, hours } = RATE_LIMITS[name];
		await withProfiles(1, async (tx, [cook]) => {
			await clearGlobal(tx, name);
			await rows(tx, name, cook, max, ago(hours, 1));
			expect(await rl.rateLimited(name, cook, tx)).toBeNull();
			await rows(tx, name, cook, max, ago(hours, -1));
			expect(await rl.rateLimited(name, cook, tx)).toBe(RATE_LIMITS[name].message);
		});
	});

	test.each(names.filter((n) => n !== 'linkReports'))(
		"%s: another cook's rows do not count",
		async (name) => {
			await withProfiles(2, async (tx, [cook, other]) => {
				await rows(tx, name, other, RATE_LIMITS[name].max);
				expect(await rl.rateLimited(name, cook, tx)).toBeNull();
			});
		}
	);

	test("linkReports counts only signed-out link reports, not a cook's", async () => {
		await withProfiles(1, async (tx, [cook]) => {
			await tx.delete(schema.reports);
			await tx.insert(schema.reports).values(
				Array.from({ length: RATE_LIMITS.linkReports.max }, () => ({
					reporterId: cook,
					targetType: 'link' as const,
					targetId: '/',
					reason: 'r'
				}))
			);
			expect(await rl.rateLimited('linkReports', null, tx)).toBeNull();
		});
	});
});
