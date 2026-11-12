import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { profiles, type ReportTarget } from '#lib/server/db/schema.js';
import {
	OWN_LIKE,
	acceptRequest,
	block,
	declineRequest,
	feedFor,
	mute,
	report,
	requestsFor,
	sendRequest,
	toggleLike,
	unblock,
	unfriend
} from '#lib/server/friends.js';
import { friendIdsOf } from '#lib/server/visibility.js';
import { ENTRIES_PER_PAGE } from '#lib/server/journal.js';
import { listPage } from '#lib/listPage.js';
import { ensureProfile } from '#lib/server/profiles.js';
import { failure, requireUser, signedOut } from '#lib/server/actions.js';
import { rateLimited } from '#lib/server/rateLimit.js';
import { REPORT_ERRORS } from '#lib/server/moderation.js';
import { MAX_REPORT } from '#lib/moderation.js';
import { oneOf, text, wholeNumber } from '#lib/helpers.js';
import type { Actions, PageServerLoad } from './$types';
import { privatePage } from '#lib/seo.js';
import { notificationsFor } from '#lib/server/notifications.js';
import { UNSEEN_MAX, forYou } from '#lib/notifications.js';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);
	// Nothing here marks the notifications seen: a hover preloads this load.
	// The page posts /notifications?/seen once it is mounted.
	const [friendIds, requests, notifications] = await Promise.all([
		friendIdsOf(user.id),
		requestsFor(user.id),
		notificationsFor(user, { limit: UNSEEN_MAX })
	]);
	// A page as long as the Journal's: the feed is mostly friends' entries.
	const { items, next } = await feedFor(user, friendIds, listPage(url, ENTRIES_PER_PAGE));
	return {
		feed: items,
		next,
		requests,
		notices: forYou(notifications),
		friendCount: friendIds.length,
		meta: privatePage('Friends')
	};
};

const invalid = (error: string) => failure(400, 'invalid', error);

/** What the feed's menus report; a link is /report's alone. */
const FEED_REPORT_TARGETS = ['log_entry', 'recipe', 'user'] as const satisfies ReportTarget[];

/**
 * The signed-in viewer and the other person a relationship form names, who
 * must exist and not be the viewer; or the failure to return.
 */
async function pair(request: Request, user: App.Locals['user']) {
	if (!user)
		return {
			ok: false as const,
			failure: signedOut()
		};
	const formData = await request.formData();
	const otherId = text(formData, 'userId');
	if (!otherId || otherId === user.id)
		return { ok: false as const, failure: invalid('Choose someone else.') };
	const other = await db.query.profiles.findFirst({ where: eq(profiles.id, otherId) });
	if (!other) return { ok: false as const, failure: invalid('That person is not on Fork.') };
	// Every row these forms write names the viewer, whose profile may not exist yet.
	await ensureProfile(user);
	return { ok: true as const, me: user.id, them: other.id };
}

export const actions: Actions = {
	request: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		const limited = await rateLimited('friendRequests', p.me);
		if (limited) return failure(429, 'rate_limited', limited);
		const outcome = await sendRequest(p.me, p.them);
		if (outcome === 'refused') return invalid("A friend request can't be sent here.");
		return { outcome };
	},

	accept: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		if (!(await acceptRequest(p.me, p.them))) return invalid('That request is no longer waiting.');
	},

	decline: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		await declineRequest(p.me, p.them);
	},

	unfriend: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		await unfriend(p.me, p.them);
	},

	block: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		await block(p.me, p.them);
	},

	unblock: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		await unblock(p.me, p.them);
	},

	mute: async ({ request, locals: { user } }) => {
		const p = await pair(request, user);
		if (!p.ok) return p.failure;
		await mute(p.me, p.them);
	},

	like: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const entryId = wholeNumber(text(await request.formData(), 'entryId'));
		if (entryId === null) return invalid('Choose an entry.');
		const result = await toggleLike(user, entryId);
		if (result === 'refused') return failure(404, 'not_found', 'Entry not found');
		if (result === 'own') return invalid(OWN_LIKE);
		return result;
	},

	report: async ({ request, locals: { user } }) => {
		if (!user) return signedOut();
		const formData = await request.formData();
		const targetType = oneOf(FEED_REPORT_TARGETS, text(formData, 'targetType'));
		const targetId = text(formData, 'targetId').trim();
		const reason = text(formData, 'reason').trim();
		if (!targetType || !targetId) return invalid('Choose what to report.');
		if (!reason) return invalid('Say what is wrong.');
		if (reason.length > MAX_REPORT) return invalid(REPORT_ERRORS.what.tooLong);
		const limited = await rateLimited('reports', user.id);
		if (limited) return failure(429, 'rate_limited', limited);
		await report(user.id, targetType, targetId, reason);
		return { reported: true };
	}
};
