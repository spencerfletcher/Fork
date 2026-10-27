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

/** An insert chain whose `.returning()` resolves `rows`; awaiting the chain itself also works. */
function insertChain(rows: unknown[]) {
	const p = Promise.resolve(rows);
	const c: Record<string, unknown> = { then: p.then.bind(p) };
	c.values = vi.fn().mockReturnValue(c);
	c.onConflictDoNothing = vi.fn().mockReturnValue(c);
	c.returning = vi.fn().mockReturnValue(p);
	return c as Record<string, ReturnType<typeof vi.fn>>;
}

const alex = { id: 'user-2', email: 'alex@outlook.com' } as User;

beforeEach(() => vi.clearAllMocks());

describe('ensureProfile', () => {
	test('does nothing when the user already has a profile', async () => {
		findFirstMock.mockResolvedValue({ id: 'user-2' });
		await ensureProfile(alex);
		expect(insertMock).not.toHaveBeenCalled();
	});

	test("takes the email's local part when it is free", async () => {
		findFirstMock.mockResolvedValue(undefined);
		const chain = insertChain([{ id: 'user-2' }]);
		insertMock.mockReturnValue(chain);
		await ensureProfile(alex);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(chain.values).toHaveBeenCalledWith({ id: 'user-2', username: 'alex' });
	});

	test('falls back to a suffixed username when another account already took it', async () => {
		findFirstMock.mockResolvedValue(undefined);
		const first = insertChain([]); // conflict on username: nothing inserted
		const second = insertChain([{ id: 'user-2' }]);
		insertMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
		await ensureProfile(alex);
		expect(insertMock).toHaveBeenCalledTimes(2);
		const retry = second.values.mock.calls[0][0] as { id: string; username: string };
		expect(retry.id).toBe('user-2');
		expect(retry.username).toMatch(/^alex-[a-f0-9]{4}$/);
	});
});
