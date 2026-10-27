import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { ensureProfile } from './profiles';

const { findFirstMock, insertMock } = vi.hoisted(() => ({
	findFirstMock: vi.fn(),
	insertMock: vi.fn()
}));
vi.mock('./db/index.js', () => ({
	db: { query: { profiles: { findFirst: findFirstMock } }, insert: insertMock }
}));

/** An insert chain whose `.returning()` resolves `rows`. */
function insertChain(rows: unknown[]) {
	const c: Record<string, unknown> = {};
	c.values = vi.fn().mockReturnValue(c);
	c.onConflictDoNothing = vi.fn().mockReturnValue(c);
	c.returning = vi.fn().mockResolvedValue(rows);
	return c as Record<string, ReturnType<typeof vi.fn>>;
}

const alex = { id: 'user-2', email: 'alex@outlook.com' } as User;

beforeEach(() => vi.clearAllMocks());

describe('ensureProfile', () => {
	test("inserts the email's local part when it is free, with no lookup first", async () => {
		const chain = insertChain([{ id: 'user-2' }]);
		insertMock.mockReturnValue(chain);
		await ensureProfile(alex);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(chain.values).toHaveBeenCalledWith({ id: 'user-2', username: 'alex' });
		expect(findFirstMock).not.toHaveBeenCalled();
	});

	test('treats a conflict on the id as success: the profile already exists', async () => {
		insertMock.mockReturnValue(insertChain([]));
		findFirstMock.mockResolvedValue({ id: 'user-2' });
		await ensureProfile(alex);
		expect(insertMock).toHaveBeenCalledTimes(1);
	});

	test('falls back to a suffixed username when another account already took it', async () => {
		const first = insertChain([]);
		const second = insertChain([{ id: 'user-2' }]);
		insertMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
		findFirstMock.mockResolvedValue(undefined);
		await ensureProfile(alex);
		expect(insertMock).toHaveBeenCalledTimes(2);
		const retry = second.values.mock.calls[0][0] as { id: string; username: string };
		expect(retry.id).toBe('user-2');
		expect(retry.username).toMatch(/^alex-[a-f0-9]{4}$/);
	});

	test('two overlapping calls for one user end with one profile and no error', async () => {
		// Both calls lose their insert (the real row landed between them), then
		// both see the row exists.
		insertMock.mockReturnValue(insertChain([]));
		findFirstMock.mockResolvedValue({ id: 'user-2' });
		await expect(Promise.all([ensureProfile(alex), ensureProfile(alex)])).resolves.toEqual([
			undefined,
			undefined
		]);
		expect(insertMock).toHaveBeenCalledTimes(2);
	});

	test('throws when neither username can be taken and no profile appears', async () => {
		insertMock.mockReturnValue(insertChain([]));
		findFirstMock.mockResolvedValue(undefined);
		await expect(ensureProfile(alex)).rejects.toThrow('Could not create a profile');
	});
});
