import { and, count, desc, eq, gt, inArray, isNotNull, isNull, max, or, sql } from 'drizzle-orm';
import * as env from '$app/env/private';
import { db, type Tx } from './db/index.js';
import { profiles, recipes, reports, type ReportTarget } from './db/schema.js';
import type { Viewer } from './visibility.js';

/**
 * The viewer is a moderator: their user id is one of MODERATOR_IDS, a
 * comma-separated list of auth user ids in the server's environment. Empty or
 * unset means nobody. Read on every call, so a test or a restart sees a change.
 */
export function isModerator(user: Viewer): boolean {
	if (!user?.id) return false;
	return (env.MODERATOR_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.includes(user.id);
}

/** ponytail: one page of at most this many, no paging; add listPage's cursor when the list outgrows it. */
export const MODERATION_LIMIT = 100;

const RECIPE: ReportTarget = 'recipe';

/**
 * What a moderator reviews at /moderation: every live recipe someone reported,
 * newest report first, then the ones hidden with no report, last hidden first.
 * A recipe report names the recipe by its id (reports.target_id, as text).
 * Each carries its reports newest first, the reporter null once their account
 * is gone. Nothing marks a report dealt with: the table has no such field.
 */
export async function moderationList(conn: Tx | typeof db = db) {
	// ponytail: reports has no index on its target, so this reads every live
	// recipe against it; add one on (target_type, target_id) when reports grow.
	const reportOf = and(
		eq(reports.targetType, RECIPE),
		eq(reports.targetId, sql`${recipes.id}::text`)
	);
	const lastReport = max(reports.createdAt);
	const rows = await conn
		.select({
			id: recipes.id,
			slug: recipes.slug,
			title: recipes.title,
			author: profiles.username,
			suppressedAt: recipes.suppressedAt
		})
		.from(recipes)
		.leftJoin(reports, reportOf)
		.leftJoin(profiles, eq(profiles.id, recipes.authorId))
		.where(isNull(recipes.deletedAt))
		.groupBy(recipes.id, profiles.username)
		.having(or(gt(count(reports.id), 0), isNotNull(recipes.suppressedAt)))
		.orderBy(sql`${lastReport} desc nulls last`, desc(recipes.suppressedAt), desc(recipes.id))
		.limit(MODERATION_LIMIT);
	if (rows.length === 0) return [];

	const filed = await conn
		.select({
			targetId: reports.targetId,
			reason: reports.reason,
			reportedAt: reports.createdAt,
			reporter: profiles.username
		})
		.from(reports)
		.leftJoin(profiles, eq(profiles.id, reports.reporterId))
		.where(
			and(
				eq(reports.targetType, RECIPE),
				inArray(
					reports.targetId,
					rows.map((r) => String(r.id))
				)
			)
		)
		.orderBy(desc(reports.createdAt), desc(reports.id));

	return rows.map(({ id, suppressedAt, ...row }) => ({
		...row,
		hidden: suppressedAt !== null,
		reports: filed
			.filter((r) => r.targetId === String(id))
			.map(({ reason, reportedAt, reporter }) => ({ reason, reportedAt, reporter }))
	}));
}
