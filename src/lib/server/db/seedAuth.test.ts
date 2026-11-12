import { describe, test, expect, vi } from 'vitest';
import { allAuthUsers, type AuthUser } from './seedAuth';

/** A fake listUsers over `total` users, `perPage` at a time, recording the pages asked for. */
function pager(total: number) {
	const users: AuthUser[] = Array.from({ length: total }, (_, i) => ({
		id: `id-${i}`,
		email: `cook${i}@example.com`
	}));
	return vi.fn(async (page: number, perPage: number) =>
		users.slice((page - 1) * perPage, page * perPage)
	);
}

describe('allAuthUsers', () => {
	test('reads past the first page, so a seed user on page three is found', async () => {
		const list = pager(114);
		const users = await allAuthUsers(list, 50);
		expect(users).toHaveLength(114);
		expect(users.find((u) => u.email === 'cook2@example.com')?.id).toBe('id-2');
		expect(users.find((u) => u.email === 'cook113@example.com')?.id).toBe('id-113');
		expect(list.mock.calls.map(([page]) => page)).toEqual([1, 2, 3]);
	});

	test('a full last page asks for one more, which comes back empty', async () => {
		const list = pager(100);
		expect(await allAuthUsers(list, 50)).toHaveLength(100);
		expect(list).toHaveBeenCalledTimes(3);
	});

	test('no users is one call and an empty list', async () => {
		const list = pager(0);
		expect(await allAuthUsers(list, 50)).toEqual([]);
		expect(list).toHaveBeenCalledTimes(1);
	});

	test('asks for the page size it was given', async () => {
		const list = pager(3);
		await allAuthUsers(list, 7);
		expect(list).toHaveBeenCalledWith(1, 7);
	});
});
