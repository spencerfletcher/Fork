import { vi, describe, test, expect, beforeEach } from 'vitest';
import { formEvent, invokeAction } from '#lib/testing/actions.js';

const { markSeenMock } = vi.hoisted(() => ({ markSeenMock: vi.fn() }));
vi.mock('#lib/server/notifications.js', () => ({ markSeen: markSeenMock }));

import { actions } from './+page.server';

const seen = (user: { id: string } | null, fields: Record<string, string> = {}) =>
	invokeAction(actions.seen as never, formEvent({ fields, locals: { user } }));

beforeEach(() => {
	markSeenMock.mockReset().mockResolvedValue(undefined);
});

describe('seen action', () => {
	test("marks the signed-in cook's notifications seen, whatever the form names", async () => {
		const result = await seen({ id: 'cook-7' }, { userId: 'someone-else' });
		expect(markSeenMock).toHaveBeenCalledExactlyOnceWith('cook-7');
		expect(result).toEqual({ seen: true });
	});

	test('a lapsed session is refused, nothing written', async () => {
		const result = await seen(null);
		expect(result).toMatchObject({ status: 401, data: { code: 'unauthenticated' } });
		expect(markSeenMock).not.toHaveBeenCalled();
	});
});
