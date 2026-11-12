import { and, eq, gt, isNull, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db, type Tx } from './db/index.js';
import {
	collections,
	friendships,
	logEntries,
	recipes,
	recipeVersions,
	reports
} from './db/schema.js';

/**
 * How many rows each write may add in its window (hours), counted from the
 * rows it leaves. Defaults set high enough that a real cook never meets them;
 * the owner tunes them here. `message` is what the refused cook reads.
 */
export const RATE_LIMITS = {
	recipes: {
		max: 30,
		hours: 1,
		message: "You've made a lot of recipes and forks in the last hour. Try again later."
	},
	edits: {
		max: 120,
		hours: 1,
		message: "You've saved a lot of changes in the last hour. Try again later."
	},
	reports: {
		max: 20,
		hours: 24,
		message: "You've sent a lot of reports today. Try again later."
	},
	// All signed-out reports together, from anyone: there is no one to count them by.
	linkReports: {
		max: 30,
		hours: 1,
		message: 'Fork has had a lot of reports in the last hour. Try again later.'
	},
	journal: {
		max: 60,
		hours: 24,
		message: "You've added a lot of Journal entries today. Try again later."
	},
	friendRequests: {
		max: 40,
		hours: 24,
		message: "You've sent a lot of friend requests today. Try again later."
	},
	collections: {
		max: 40,
		hours: 24,
		message: "You've made a lot of collections today. Try again later."
	}
} as const;

export type RateLimit = keyof typeof RATE_LIMITS;

/** The cook's rows, or none's (a signed-out write) when `who` is null. */
const by = (column: PgColumn, who: string | null) =>
	who === null ? isNull(column) : eq(column, who);

// Each write's rows: its table, the time they were made, and whose they are.
// Every count leads with an indexed column (schema.ts), except reports, which
// has no index on its reporter: a scan, cheap while reports are few.
const SOURCES: Record<
	RateLimit,
	(who: string | null) => { table: PgTable; createdAt: PgColumn; whose: SQL | undefined }
> = {
	recipes: (who) => ({
		table: recipes,
		createdAt: recipes.createdAt,
		whose: by(recipes.authorId, who)
	}),
	edits: (who) => ({
		table: recipeVersions,
		createdAt: recipeVersions.createdAt,
		whose: by(recipeVersions.createdBy, who)
	}),
	reports: (who) => ({
		table: reports,
		createdAt: reports.createdAt,
		whose: by(reports.reporterId, who)
	}),
	linkReports: () => ({
		table: reports,
		createdAt: reports.createdAt,
		whose: and(isNull(reports.reporterId), eq(reports.targetType, 'link'))
	}),
	journal: (who) => ({
		table: logEntries,
		createdAt: logEntries.createdAt,
		whose: by(logEntries.userId, who)
	}),
	friendRequests: (who) => ({
		table: friendships,
		createdAt: friendships.createdAt,
		whose: by(friendships.requesterId, who)
	}),
	collections: (who) => ({
		table: collections,
		createdAt: collections.createdAt,
		whose: by(collections.ownerId, who)
	})
};

/**
 * Why `who` may not make one more `name` row now, or null when they may: they
 * already made its `max` in the last `hours`. Run before the write.
 * ponytail: count then insert, so two writes at once can both pass at max - 1;
 * fine for abuse basics, a lock per cook if an exact cap ever matters.
 */
export async function rateLimited(
	name: RateLimit,
	who: string | null,
	conn: Tx | typeof db = db
): Promise<string | null> {
	const { max, hours, message } = RATE_LIMITS[name];
	const { table, createdAt, whose } = SOURCES[name](who);
	const since = gt(createdAt, sql`now() - make_interval(hours => ${hours})`);
	const made = await conn.$count(table, and(whose, since));
	return made >= max ? message : null;
}
