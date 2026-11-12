import { vi, describe, test, expect, beforeEach } from 'vitest';
import { invokeAction, formEvent, loadEvent, loadPage } from '#lib/testing/actions.js';
import type { PageData } from './$types';
import { OWN_LIKE } from '#lib/server/friends.js';
import { MAX_REPORT } from '#lib/server/moderation.js';
import { actions, load } from './+page.server';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { ENTRIES_PER_PAGE } from '#lib/server/journal.js';
import { LIMITED, LIMITED_FAILURE } from '#lib/testing/rateLimit.js';
import { UNSEEN_MAX, forYou } from '#lib/notifications.js';

const m = vi.hoisted(() => ({
	findProfile: vi.fn(),
	sendRequest: vi.fn(),
	acceptRequest: vi.fn(),
	declineRequest: vi.fn(),
	unfriend: vi.fn(),
	block: vi.fn(),
	unblock: vi.fn(),
	mute: vi.fn(),
	toggleLike: vi.fn(),
	report: vi.fn(),
	feedFor: vi.fn(),
	requestsFor: vi.fn(),
	friendIdsOf: vi.fn(),
	rateLimited: vi.fn(),
	notificationsFor: vi.fn(),
	markSeen: vi.fn()
}));

vi.mock('#lib/server/notifications.js', () => ({
	notificationsFor: m.notificationsFor,
	markSeen: m.markSeen
}));

vi.mock('#lib/server/db/index.js', () => ({
	db: { query: { profiles: { findFirst: m.findProfile } } }
}));
vi.mock('#lib/server/friends.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/friends.js')>()),
	sendRequest: m.sendRequest,
	acceptRequest: m.acceptRequest,
	declineRequest: m.declineRequest,
	unfriend: m.unfriend,
	block: m.block,
	unblock: m.unblock,
	mute: m.mute,
	toggleLike: m.toggleLike,
	report: m.report,
	feedFor: m.feedFor,
	requestsFor: m.requestsFor
}));
vi.mock('#lib/server/visibility.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/visibility.js')>()),
	friendIdsOf: m.friendIdsOf
}));
vi.mock('#lib/server/rateLimit.js', () => ({ rateLimited: m.rateLimited }));
vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: vi.fn().mockResolvedValue(undefined) }));

const ME = { id: 'me' };
const THEM = { id: 'them', username: 'devcooks' };

const run = (
	name: keyof typeof actions,
	fields: Record<string, string>,
	user: typeof ME | null = ME
) => invokeAction(actions[name] as never, formEvent({ fields, locals: { user } }));

beforeEach(() => {
	vi.clearAllMocks();
	m.findProfile.mockResolvedValue(THEM);
	m.rateLimited.mockResolvedValue(null);
	m.notificationsFor.mockResolvedValue([]);
});

describe('rate limits', () => {
	test('a friend request past the cap is refused before it is sent', async () => {
		m.rateLimited.mockResolvedValue(LIMITED);
		expect(await run('request', { userId: THEM.id })).toMatchObject(LIMITED_FAILURE);
		expect(m.rateLimited).toHaveBeenCalledWith('friendRequests', ME.id);
		expect(m.sendRequest).not.toHaveBeenCalled();
	});

	test('a report past the cap is refused before it is filed', async () => {
		m.rateLimited.mockResolvedValue(LIMITED);
		const fields = { targetType: 'log_entry', targetId: '5', reason: 'Spam' };
		expect(await run('report', fields)).toMatchObject(LIMITED_FAILURE);
		expect(m.rateLimited).toHaveBeenCalledWith('reports', ME.id);
		expect(m.report).not.toHaveBeenCalled();
	});
});

describe('friends load', () => {
	test('signed out goes to log in', async () => {
		await expect(load(loadEvent({ path: '/friends' }))).rejects.toMatchObject({ status: 303 });
	});

	test('the feed, the waiting requests and how many friends', async () => {
		m.feedFor.mockResolvedValue({ items: [], next: null });
		m.requestsFor.mockResolvedValue([{ id: 'p', username: 'priyabakes', sentAt: new Date() }]);
		m.friendIdsOf.mockResolvedValue(['a', 'b']);
		const data = await load(loadEvent({ path: '/friends', user: ME }));
		expect(data).toMatchObject({
			feed: [],
			next: null,
			friendCount: 2,
			requests: [{ username: 'priyabakes' }],
			meta: { noindex: true }
		});
		// One friends lookup: the feed is handed the ids the count uses.
		expect(m.friendIdsOf).toHaveBeenCalledTimes(1);
		expect(m.feedFor).toHaveBeenCalledWith(ME, ['a', 'b'], {
			after: null,
			limit: ENTRIES_PER_PAGE,
			per: ENTRIES_PER_PAGE
		});
	});

	// A page as long as the Journal's; Show more's fetch reads one page after its cursor.
	test('reads one page of the feed, or the page after a cursor, and hands on its cursor', async () => {
		m.feedFor.mockResolvedValue({ items: [], next: 'cursor-2' });
		m.requestsFor.mockResolvedValue([]);
		m.friendIdsOf.mockResolvedValue(['a']);
		const data = await load(loadEvent({ path: '/friends?after=cursor-1', user: ME }));
		expect(m.feedFor).toHaveBeenCalledWith(ME, ['a'], {
			after: 'cursor-1',
			limit: ENTRIES_PER_PAGE,
			per: ENTRIES_PER_PAGE
		});
		expect(data).toMatchObject({ next: 'cursor-2' });
	});

	test("For you: what is new, grouped by forYou from the cook's notifications", async () => {
		m.feedFor.mockResolvedValue({ items: [], next: null });
		m.requestsFor.mockResolvedValue([]);
		m.friendIdsOf.mockResolvedValue([]);
		const items = [
			{
				id: 'save-1-a',
				kind: 'save',
				at: new Date(),
				unseen: true,
				username: 'ana',
				recipe: { slug: 'dal', title: 'Dal' }
			},
			{
				id: 'save-1-b',
				kind: 'save',
				at: new Date(),
				unseen: true,
				username: 'bo',
				recipe: { slug: 'dal', title: 'Dal' }
			}
		];
		m.notificationsFor.mockResolvedValue(items);
		const data = await loadPage<PageData>(load, loadEvent({ path: '/friends', user: ME }));
		expect(m.notificationsFor).toHaveBeenCalledWith(ME, { limit: UNSEEN_MAX });
		expect(data.notices).toEqual(forYou(items as never));
	});

	// A hover preloads this load; only the page, once mounted, marks things seen.
	test('reading never marks anything seen', async () => {
		m.feedFor.mockResolvedValue({ items: [], next: null });
		m.requestsFor.mockResolvedValue([]);
		m.friendIdsOf.mockResolvedValue([]);
		await load(loadEvent({ path: '/friends', user: ME }));
		expect(m.markSeen).not.toHaveBeenCalled();
	});
});

describe('relationship actions', () => {
	test.each(['request', 'accept', 'decline', 'unfriend', 'block', 'unblock', 'mute'] as const)(
		'%s refuses oneself and anyone not on Fork, and calls nothing',
		async (name) => {
			expect(await run(name, { userId: ME.id })).toMatchObject({ status: 400 });
			m.findProfile.mockResolvedValue(undefined);
			expect(await run(name, { userId: 'ghost' })).toMatchObject({ status: 400 });
			for (const fn of [
				m.sendRequest,
				m.acceptRequest,
				m.declineRequest,
				m.unfriend,
				m.block,
				m.unblock,
				m.mute
			])
				expect(fn).not.toHaveBeenCalled();
		}
	);

	test.each([
		['unfriend', m.unfriend],
		['block', m.block],
		['unblock', m.unblock],
		['mute', m.mute],
		['decline', m.declineRequest]
	] as const)('%s acts for the signed-in viewer on the named person', async (name, fn) => {
		await run(name, { userId: THEM.id });
		expect(fn).toHaveBeenCalledWith(ME.id, THEM.id);
	});

	test('a refused request (blocked, already friends) is a 400', async () => {
		m.sendRequest.mockResolvedValue('refused');
		expect(await run('request', { userId: THEM.id })).toMatchObject({ status: 400 });
	});

	test.each(['request', 'accept', 'decline', 'unfriend', 'block', 'unblock', 'mute'])(
		'%s signed out is a 401 form failure saying the session ended',
		async (name) => {
			expect(await run(name, { userId: THEM.id }, null)).toMatchObject({
				status: 401,
				data: { error: SESSION_ENDED('try again'), code: 'unauthenticated' }
			});
		}
	);
});

describe('like', () => {
	test('an entry the viewer cannot see is a 404', async () => {
		m.toggleLike.mockResolvedValue('refused');
		expect(await run('like', { entryId: '5' })).toMatchObject({ status: 404 });
		expect(m.toggleLike).toHaveBeenCalledWith(ME, 5);
	});

	test('liking your own entry is a 400 in the error shape', async () => {
		m.toggleLike.mockResolvedValue('own');
		expect(await run('like', { entryId: '5' })).toMatchObject({
			status: 400,
			data: { error: OWN_LIKE, code: 'invalid' }
		});
	});

	test('a malformed id never reaches the database', async () => {
		expect(await run('like', { entryId: '5; drop' })).toMatchObject({ status: 400 });
		expect(m.toggleLike).not.toHaveBeenCalled();
	});

	test('signed out is a 401 form failure saying the session ended', async () => {
		expect(await run('like', { entryId: '5' }, null)).toMatchObject({
			status: 401,
			data: { error: SESSION_ENDED('try again'), code: 'unauthenticated' }
		});
		expect(m.toggleLike).not.toHaveBeenCalled();
	});
});

describe('report', () => {
	test('signed out is a 401 form failure saying the session ended, and files nothing', async () => {
		const fields = { targetType: 'log_entry', targetId: '5', reason: 'Spam' };
		expect(await run('report', fields, null)).toMatchObject({
			status: 401,
			data: { error: SESSION_ENDED('try again'), code: 'unauthenticated' }
		});
		expect(m.report).not.toHaveBeenCalled();
	});

	test('files the target and the reason', async () => {
		await run('report', { targetType: 'log_entry', targetId: '5', reason: ' Spam ' });
		expect(m.report).toHaveBeenCalledWith(ME.id, 'log_entry', '5', 'Spam');
	});

	test.each([
		[{ targetType: 'comment', targetId: '5', reason: 'x' }],
		// /report's own target, never the feed's.
		[{ targetType: 'link', targetId: '/x', reason: 'x' }],
		[{ targetType: 'user', targetId: 'them', reason: ' ' }],
		[{ targetType: 'user', targetId: 'them', reason: 'x'.repeat(MAX_REPORT + 1) }]
	])('%o is refused', async (fields) => {
		expect(await run('report', fields)).toMatchObject({ status: 400 });
		expect(m.report).not.toHaveBeenCalled();
	});
});
