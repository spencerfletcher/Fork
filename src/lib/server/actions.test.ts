import { describe, test, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { failure, requireUser, SESSION_ENDED } from './actions';
import { loginHref } from '#lib/auth/loginHref.js';

describe('failure', () => {
	test('the { error, code } shape at the status, with what the form hands back', () => {
		const result = failure(409, 'stale', 'Reload.', { draft: { title: 'Soup' } });
		expect(result.status).toBe(409);
		expect(result.data).toEqual({ error: 'Reload.', code: 'stale', draft: { title: 'Soup' } });
	});

	test('with nothing to hand back, only the error and code', () => {
		expect(failure(404, 'not_found', 'Entry not found').data).toEqual({
			error: 'Entry not found',
			code: 'not_found'
		});
	});
});

describe('SESSION_ENDED', () => {
	test('ends with what to do once logged in again', () => {
		expect(SESSION_ENDED('delete again')).toMatch(/^Your session ended\..* then delete again\.$/);
	});
});

describe('requireUser', () => {
	const url = new URL('http://x/journal/5/edit?from=nav');

	test('a signed-in user passes', () => {
		expect(() => requireUser(url, { id: 'u' })).not.toThrow();
	});

	test('anyone else is sent to log in and brought back here', () => {
		try {
			requireUser(url, null);
			expect.unreachable();
		} catch (e) {
			expect(isRedirect(e) && e).toMatchObject({
				status: 303,
				location: loginHref('/journal/5/edit?from=nav')
			});
		}
	});
});
