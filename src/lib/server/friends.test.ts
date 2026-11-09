import { vi, describe, test, expect, beforeEach } from 'vitest';
import { chain } from '#lib/testing/drizzle.js';

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

import { feedFor, relationFrom, sendRequest, toggleLike } from './friends.js';

const ME = 'me';
const THEM = 'them';

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
		[makePair(THEM, 'blocked'), 'blocked']
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
		expect(updateMock.mock.results[0].value.set).toHaveBeenCalledWith({ status: 'accepted' });
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

	test('nobody can befriend themselves', async () => {
		expect(await sendRequest(ME, ME)).toBe('refused');
		expect(selectMock).not.toHaveBeenCalled();
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
	test('with every friend muted, the feed is empty and reads nothing more', async () => {
		selectMock
			.mockReturnValueOnce(chain([makePair(THEM, 'accepted')]))
			.mockReturnValueOnce(chain([{ id: THEM }]));
		expect(await feedFor({ id: ME })).toEqual([]);
		expect(selectMock).toHaveBeenCalledTimes(2);
	});
});
