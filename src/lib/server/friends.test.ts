import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const { selectMock, insertMock, updateMock, deleteMock, transactionMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	insertMock: vi.fn(),
	updateMock: vi.fn(),
	deleteMock: vi.fn(),
	transactionMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => {
	const db = {
		select: selectMock,
		insert: insertMock,
		update: updateMock,
		delete: deleteMock,
		transaction: transactionMock
	};
	// The transaction hands its callback the same mocks.
	transactionMock.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db));
	return { db };
});

import { blockIn, feedFor, relationFrom, sendRequest, toggleLike, unblock } from './friends.js';

const ME = 'me';
const THEM = 'them';

// The accept is dated by the database's clock, as created_at is: the "accepted your request" notification reads it.
const ACCEPTED_NOW = {
	status: 'accepted',
	acceptedAt: expect.objectContaining({ queryChunks: expect.anything() })
};

type Status = 'pending' | 'accepted' | 'blocked';
const makePair = (requesterId: string, status: Status) => ({
	requesterId,
	addresseeId: requesterId === ME ? THEM : ME,
	status
});

beforeEach(() => {
	selectMock.mockReset();
	insertMock.mockReset().mockReturnValue(chain([{ requesterId: ME }]));
	updateMock.mockReset().mockReturnValue(chain([{ requesterId: THEM }]));
	deleteMock.mockReset().mockReturnValue(chain([]));
});

describe('relationFrom', () => {
	test.each([
		[undefined, 'none'],
		[makePair(ME, 'pending'), 'sent'],
		[makePair(THEM, 'pending'), 'received'],
		[makePair(ME, 'accepted'), 'friends'],
		[makePair(THEM, 'accepted'), 'friends'],
		[makePair(ME, 'blocked'), 'blocked'],
		// The blocked side is not told: to them it reads as no relation.
		[makePair(THEM, 'blocked'), 'none']
	] as const)('%o reads as %s', (row, relation) => {
		expect(relationFrom(row, ME)).toBe(relation);
	});
});

describe('sendRequest', () => {
	test('with no row, writes a pending request from me', async () => {
		selectMock.mockReturnValue(chain([]));
		expect(await sendRequest(ME, THEM)).toBe('sent');
		const values = insertMock.mock.results[0].value.values;
		expect(values).toHaveBeenCalledWith({ requesterId: ME, addresseeId: THEM, status: 'pending' });
	});

	test('a request they already sent is accepted in place, keeping their row', async () => {
		selectMock.mockReturnValue(chain([makePair(THEM, 'pending')]));
		expect(await sendRequest(ME, THEM)).toBe('accepted');
		expect(updateMock.mock.results[0].value.set).toHaveBeenCalledWith(ACCEPTED_NOW);
		expect(insertMock).not.toHaveBeenCalled();
	});

	test.each([
		['I blocked them', makePair(ME, 'blocked')],
		['they blocked me', makePair(THEM, 'blocked')],
		['already friends', makePair(THEM, 'accepted')],
		['already asked', makePair(ME, 'pending')]
	])('refused when %s, and nothing is written', async (_, row) => {
		selectMock.mockReturnValue(chain([row]));
		expect(await sendRequest(ME, THEM)).toBe('refused');
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateMock).not.toHaveBeenCalled();
	});

	// Both saw no row; the other request's insert won the pair index.
	test('a crossing request (theirs landed first) is accepted instead of refused', async () => {
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([makePair(THEM, 'pending')]));
		insertMock.mockReturnValue(chain([]));
		expect(await sendRequest(ME, THEM)).toBe('accepted');
		expect(updateMock.mock.results[0].value.set).toHaveBeenCalledWith(ACCEPTED_NOW);
	});

	test('a race lost to a block is still refused', async () => {
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([makePair(THEM, 'blocked')]));
		insertMock.mockReturnValue(chain([]));
		expect(await sendRequest(ME, THEM)).toBe('refused');
		expect(updateMock).not.toHaveBeenCalled();
	});

	test('nobody can befriend themselves', async () => {
		expect(await sendRequest(ME, ME)).toBe('refused');
		expect(selectMock).not.toHaveBeenCalled();
	});
});

describe('blockIn', () => {
	const tx = { select: selectMock, insert: insertMock, update: updateMock, delete: deleteMock };
	const blockedSet = { requesterId: ME, addresseeId: THEM, status: 'blocked' };
	const blockWrites = () =>
		updateMock.mock.results.filter((r) =>
			r.value.set.mock.calls.some(([v]: [unknown]) => v && (v as { status?: string }).status)
		);

	test('with no row in the way, inserts the blocked row and updates no pair row', async () => {
		selectMock.mockReturnValue(chain([]));
		await blockIn(tx as never, ME, THEM);
		expect(insertMock.mock.results[0].value.values).toHaveBeenCalledWith(blockedSet);
		expect(blockWrites()).toHaveLength(0);
	});

	// A request inserted between the unfriend's delete and the block's insert.
	test('a request that raced in is overwritten by the block, not a unique-index error', async () => {
		// The pair row, then each side's Friends recipes and forks to privatise.
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([makePair(THEM, 'pending')]))
			.mockReturnValue(chain([]));
		insertMock.mockReturnValue(chain([]));
		await blockIn(tx as never, ME, THEM);
		expect(insertMock.mock.results[0].value.onConflictDoNothing).toHaveBeenCalled();
		const [write] = blockWrites();
		expect(write.value.set).toHaveBeenCalledWith(blockedSet);
	});

	test('a block they raced in first is kept as theirs', async () => {
		// The pair row, then each side's Friends recipes and forks to privatise.
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([makePair(THEM, 'blocked')]))
			.mockReturnValue(chain([]));
		insertMock.mockReturnValue(chain([]));
		await blockIn(tx as never, ME, THEM);
		expect(blockWrites()).toHaveLength(0);
	});
});

describe('unblock', () => {
	test('deletes only the block I wrote, never theirs or a friendship', async () => {
		await unblock(ME, THEM);
		const where = deleteMock.mock.results[0].value.where.mock.calls[0][0] as SQL;
		expect(new PgDialect().sqlToQuery(where)).toMatchObject({
			sql: '("friendships"."requester_id" = $1 and "friendships"."addressee_id" = $2 and "friendships"."status" = $3)',
			params: [ME, THEM, 'blocked']
		});
	});
});

describe('toggleLike', () => {
	const ENTRY = 5;

	test("likes a friend's Friends entry", async () => {
		selectMock
			.mockReturnValueOnce(chain([{ userId: THEM, audience: 'friends' }]))
			.mockReturnValueOnce(chain([makePair(THEM, 'accepted')]));
		expect(await toggleLike({ id: ME }, ENTRY)).toEqual({ liked: true });
		expect(insertMock.mock.results[0].value.values).toHaveBeenCalledWith({
			userId: ME,
			logEntryId: ENTRY
		});
	});

	test('a second press unlikes', async () => {
		selectMock
			.mockReturnValueOnce(chain([{ userId: THEM, audience: 'friends' }]))
			.mockReturnValueOnce(chain([makePair(THEM, 'accepted')]));
		deleteMock.mockReturnValue(chain([{ userId: ME }]));
		expect(await toggleLike({ id: ME }, ENTRY)).toEqual({ liked: false });
		expect(insertMock).not.toHaveBeenCalled();
	});

	test('my own entry is refused as own, and nothing is read or written past it', async () => {
		selectMock.mockReturnValueOnce(chain([{ userId: ME, audience: 'friends' }]));
		expect(await toggleLike({ id: ME }, ENTRY)).toBe('own');
		expect(selectMock).toHaveBeenCalledTimes(1);
		expect(insertMock).not.toHaveBeenCalled();
		expect(deleteMock).not.toHaveBeenCalled();
	});

	// A block deletes the friendship, so the blocked side has no friend to see it through.
	test('refused without an accepted friendship, as after a block, and refused on a private entry', async () => {
		selectMock
			.mockReturnValueOnce(chain([{ userId: THEM, audience: 'friends' }]))
			.mockReturnValueOnce(chain([]));
		expect(await toggleLike({ id: ME }, ENTRY)).toBe('refused');

		selectMock
			.mockReturnValueOnce(chain([{ userId: THEM, audience: 'private' }]))
			.mockReturnValueOnce(chain([makePair(THEM, 'accepted')]));
		expect(await toggleLike({ id: ME }, ENTRY)).toBe('refused');

		expect(insertMock).not.toHaveBeenCalled();
		expect(deleteMock).not.toHaveBeenCalled();
	});
});

describe('feedFor', () => {
	const PAGE = { after: null, limit: 30 };

	test("reads only friends' Friends-level entries, never their private ones", async () => {
		const entries = chain([]);
		selectMock
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(entries)
			.mockReturnValueOnce(chain([]));
		expect(await feedFor({ id: ME }, [THEM], PAGE)).toEqual({ items: [], next: null });
		const where = entries.where.mock.calls[0][0] as SQL;
		expect(new PgDialect().sqlToQuery(where)).toMatchObject({
			sql: '("log_entries"."user_id" in ($1) and "log_entries"."audience" = $2)',
			params: [THEM, 'friends']
		});
	});

	test('with every friend muted, the feed is empty and reads nothing more', async () => {
		selectMock.mockReturnValueOnce(chain([{ id: THEM }]));
		expect(await feedFor({ id: ME }, [THEM], PAGE)).toEqual({ items: [], next: null });
		expect(selectMock).toHaveBeenCalledTimes(1);
	});
});
