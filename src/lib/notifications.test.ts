import { describe, test, expect } from 'vitest';
import { FOR_YOU_ROWS, NOTIFICATION_KINDS, forYou, mutedKinds } from './notifications.js';
import type { Notification } from './server/notifications.js';

describe('mutedKinds', () => {
	test("keeps the list's kinds in the list's order and ignores anything else", () => {
		const [first, second] = NOTIFICATION_KINDS;
		expect(mutedKinds([second, 'retired-kind', first, second])).toEqual([first, second]);
	});

	test('nothing stored is nothing muted', () => {
		expect(mutedKinds([])).toEqual([]);
	});
});

describe('forYou', () => {
	const at = (minute: number) => new Date(Date.UTC(2026, 10, 12, 9, minute));
	const base = (id: string, minute: number, username: string | null, unseen = true) => ({
		id,
		at: at(minute),
		unseen,
		username
	});
	const save = (id: string, minute: number, username: string | null, slug = 'shakshuka') =>
		({ ...base(id, minute, username), kind: 'save', recipe: { slug, title: slug } }) as const;
	const like = (id: string, minute: number, username: string, entryId: number) =>
		({ ...base(id, minute, username), kind: 'like', entry: { id: entryId, dish: 'Dal' } }) as const;

	test('only what is unseen, and never a request (the band lists those from requestsFor)', () => {
		const items: Notification[] = [
			{ ...base('request-a', 9, 'ana'), kind: 'request' },
			{ ...base('accepted-b', 8, 'bo', false), kind: 'accepted' },
			{ ...base('accepted-c', 7, 'cy'), kind: 'accepted' }
		];
		expect(forYou(items).map((n) => n.id)).toEqual(['accepted-c']);
	});

	test("several people on one target are one row, at the newest one's place, counting the others", () => {
		const items: Notification[] = [
			save('s1', 9, 'ana'),
			like('l1', 8, 'bo', 4),
			save('s2', 7, 'cy'),
			save('s3', 6, 'di'),
			like('l2', 5, 'ed', 5)
		];
		expect(forYou(items).map((n) => [n.kind, n.username, n.others])).toEqual([
			['save', 'ana', 2],
			['like', 'bo', 0],
			['like', 'ed', 0]
		]);
	});

	test('a group is led by its newest named cook, at the newest time; one cook twice counts once', () => {
		const forks: Notification[] = [
			{ ...base('f1', 9, null), kind: 'fork', recipe: { slug: 'dal', title: 'Dal' }, fork: null },
			{
				...base('f2', 8, 'ana'),
				kind: 'fork',
				recipe: { slug: 'dal', title: 'Dal' },
				fork: { slug: 'dal-2', title: 'Dal 2' }
			},
			{
				...base('f3', 7, 'ana'),
				kind: 'fork',
				recipe: { slug: 'dal', title: 'Dal' },
				fork: { slug: 'dal-3', title: 'Dal 3' }
			}
		];
		expect(forYou(forks)).toEqual([expect.objectContaining({ username: 'ana', others: 1, at: at(9) })]);
	});

	test('at most FOR_YOU_ROWS rows, newest first; the rest are not shown', () => {
		const items = Array.from({ length: FOR_YOU_ROWS + 3 }, (_, i) => like(`l${i}`, 50 - i, 'ana', i));
		expect(forYou(items).map((n) => n.id)).toEqual(items.slice(0, FOR_YOU_ROWS).map((n) => n.id));
	});
});
