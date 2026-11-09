import { vi, describe, test, expect, beforeEach } from 'vitest';
import { invokeAction, formEvent } from '#lib/testing/actions.js';
import { MAX_REPORT, OWN_LIKE } from '#lib/server/friends.js';
import { actions, load } from './+page.server';

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
	friendIdsOf: vi.fn()
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
});

describe('friends load', () => {
	test('signed out goes to log in', async () => {
		await expect(
			load({ url: new URL('http://l/friends'), locals: { user: null } } as never)
		).rejects.toMatchObject({ status: 303 });
	});

	test('the feed, the waiting requests and how many friends', async () => {
		m.feedFor.mockResolvedValue([]);
		m.requestsFor.mockResolvedValue([{ id: 'p', username: 'priyabakes', sentAt: new Date() }]);
		m.friendIdsOf.mockResolvedValue(['a', 'b']);
		const data = await load({ url: new URL('http://l/friends'), locals: { user: ME } } as never);
		expect(data).toMatchObject({
			feed: [],
			friendCount: 2,
			requests: [{ username: 'priyabakes' }]
		});
		// One friends lookup: the feed is handed the ids the count uses.
		expect(m.friendIdsOf).toHaveBeenCalledTimes(1);
		expect(m.feedFor).toHaveBeenCalledWith(ME, ['a', 'b']);
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

	test('signed out is a 401', async () => {
		expect(await run('block', { userId: THEM.id }, null)).toMatchObject({ status: 401 });
	});
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
});

describe('report', () => {
	test('files the target and the reason', async () => {
		await run('report', { targetType: 'log_entry', targetId: '5', reason: ' Spam ' });
		expect(m.report).toHaveBeenCalledWith(ME.id, 'log_entry', '5', 'Spam');
	});

	test.each([
		[{ targetType: 'comment', targetId: '5', reason: 'x' }],
		[{ targetType: 'user', targetId: 'them', reason: ' ' }],
		[{ targetType: 'user', targetId: 'them', reason: 'x'.repeat(MAX_REPORT + 1) }]
	])('%o is refused', async (fields) => {
		expect(await run('report', fields)).toMatchObject({ status: 400 });
		expect(m.report).not.toHaveBeenCalled();
	});
});
