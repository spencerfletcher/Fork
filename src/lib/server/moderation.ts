import { and, count, desc, eq, gt, inArray, isNotNull, isNull, max, or, sql } from 'drizzle-orm';
import * as env from '$app/env/private';
import { db, type Tx } from './db/index.js';
import { profiles, recipes, reports, type ReportTarget } from './db/schema.js';
import type { Viewer } from './visibility.js';
import { EMAIL_MESSAGE } from '#lib/auth/emailCheck.svelte.js';

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
const LINK: ReportTarget = 'link';

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

/** The longest report anyone writes, from the feed's menus or /report, in characters. */
export const MAX_REPORT = 1000;

/** The longest link and address /report takes, in characters. */
export const LINK_MAX = 500;
export const CONTACT_MAX = 254;

/** What /report says of each field it refuses. */
export const REPORT_ERRORS = {
	link: {
		missing: 'Paste the link to the page on Fork.',
		notFork: 'Use a link to a page on Fork, copied from the address bar.',
		tooLong: `Keep the link under ${LINK_MAX} characters.`
	},
	what: {
		missing: 'Say what is wrong.',
		tooLong: `Keep the report under ${MAX_REPORT.toLocaleString('en-US')} characters.`
	},
	contact: {
		missing: 'Enter your email, so we can reply.',
		invalid: EMAIL_MESSAGE
	}
} as const;

// A link report (/report) keeps the reporter's address in its reason, as the
// reason's first line: the table has no column for it. An address holds no
// space, so the line reads back whole.
const CONTACT = /^Contact: (\S+)\n\n([\s\S]*)$/;

/** A link report's reason: the contact line, a blank line, then what the reporter wrote. */
export const withContact = (contact: string, text: string) => `Contact: ${contact}\n\n${text}`;

/** What withContact wrote, split again; a reason with no contact line (the feed's) has none. */
export function contactOf(reason: string): { contact: string | null; text: string } {
	const m = CONTACT.exec(reason);
	return m ? { contact: m[1], text: m[2] } : { contact: null, text: reason };
}

/** Files a /report: `path` is on Fork, `reporterId` the signed-in cook or null. */
export async function fileLinkReport(
	reporterId: string | null,
	path: string,
	contact: string,
	text: string,
	conn: Tx | typeof db = db
): Promise<void> {
	await conn.insert(reports).values({
		reporterId,
		targetType: LINK,
		targetId: path,
		reason: withContact(contact, text)
	});
}

/**
 * The /report reports for /moderation, newest first, at most MODERATION_LIMIT:
 * the path reported, what the reporter wrote, their address, the day, and the
 * cook's handle when one was signed in (null too once their account is gone).
 */
export async function linkReportList(conn: Tx | typeof db = db) {
	const rows = await conn
		.select({
			path: reports.targetId,
			reason: reports.reason,
			reportedAt: reports.createdAt,
			reporter: profiles.username
		})
		.from(reports)
		.leftJoin(profiles, eq(profiles.id, reports.reporterId))
		.where(eq(reports.targetType, LINK))
		.orderBy(desc(reports.createdAt), desc(reports.id))
		.limit(MODERATION_LIMIT);
	return rows.map(({ reason, ...row }) => ({ ...row, ...contactOf(reason) }));
}
