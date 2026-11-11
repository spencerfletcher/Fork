import { describe, test, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { closeDbAfter, localDb, withProfiles } from '#lib/testing/db.js';

closeDbAfter();

// Runs only against the local Supabase stack, inside a transaction that is
// always rolled back, so it leaves no row behind.
describe.skipIf(!localDb)('the moderation list, against the real database', () => {
	let schema: typeof import('#lib/server/db/schema.js');
	let moderation: typeof import('./moderation.js');

	beforeAll(async () => {
		schema = await import('#lib/server/db/schema.js');
		moderation = await import('./moderation.js');
	});

	test('reported and hidden recipes, newest report first, then hidden ones with none; each report with its reason, day and reporter, anonymous once their account is gone', async () => {
		await withProfiles(3, async (tx, [author, reporter, gone], s) => {
			const at = (iso: string) => new Date(iso);
			const recipe = async (slug: string, extra: { suppressedAt?: Date; deletedAt?: Date } = {}) =>
				(
					await tx
						.insert(schema.recipes)
						.values({
							authorId: author,
							slug: `${slug}-${s}`,
							title: slug,
							visibility: 'public',
							...extra
						})
						.returning({ id: schema.recipes.id })
				)[0].id;
			const older = await recipe('older');
			const newer = await recipe('newer', { suppressedAt: at('2099-01-03T00:00:00Z') });
			const hiddenOnly = await recipe('hidden-only', { suppressedAt: at('2099-01-01T00:00:00Z') });
			const trashed = await recipe('trashed', { deletedAt: new Date() });
			await recipe('untouched');
			// Far-future days put these first among whatever the local database holds.
			const file = (targetId: number, reporterId: string, day: string, reason: string) =>
				tx.insert(schema.reports).values({
					reporterId,
					targetType: 'recipe',
					targetId: String(targetId),
					reason,
					createdAt: at(day)
				});
			await file(older, reporter, '2099-02-01T00:00:00Z', 'Copied from a book');
			await file(older, gone, '2099-02-02T00:00:00Z', 'Not a recipe');
			await file(newer, reporter, '2099-02-05T00:00:00Z', 'Rude words');
			await file(trashed, reporter, '2099-02-09T00:00:00Z', 'Gone anyway');
			// A user report with a recipe's id is not a recipe report.
			await tx.insert(schema.reports).values({
				reporterId: reporter,
				targetType: 'user',
				targetId: String(hiddenOnly),
				reason: 'About the cook'
			});
			await tx.delete(schema.profiles).where(eq(schema.profiles.id, gone));

			const list = await moderation.moderationList(tx);
			const ours = list.filter((r) => r.slug.endsWith(`-${s}`));
			expect(ours.map((r) => r.title)).toEqual(['newer', 'older', 'hidden-only']);
			const [usernameOfAuthor] = await tx
				.select({ username: schema.profiles.username })
				.from(schema.profiles)
				.where(eq(schema.profiles.id, author));
			const [reporterName] = await tx
				.select({ username: schema.profiles.username })
				.from(schema.profiles)
				.where(eq(schema.profiles.id, reporter));
			expect(ours[1]).toEqual({
				slug: `older-${s}`,
				title: 'older',
				author: usernameOfAuthor.username,
				hidden: false,
				reports: [
					{ reason: 'Not a recipe', reportedAt: at('2099-02-02T00:00:00Z'), reporter: null },
					{
						reason: 'Copied from a book',
						reportedAt: at('2099-02-01T00:00:00Z'),
						reporter: reporterName.username
					}
				]
			});
			expect(ours[0]).toMatchObject({ hidden: true, reports: [{ reason: 'Rude words' }] });
			expect(ours[2]).toMatchObject({ hidden: true, reports: [] });
			expect(list.length).toBeLessThanOrEqual(moderation.MODERATION_LIMIT);
		});
	});
});
