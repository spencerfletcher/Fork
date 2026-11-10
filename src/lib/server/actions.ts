import { fail, redirect } from '@sveltejs/kit';
import { loginHref } from '#lib/auth/loginHref.js';

/** Why an action failed, for code that branches on it; the failure's `error` is what the reader sees. */
export const FAILURE_CODES = [
	'invalid',
	'stale',
	'upload_failed',
	'save_failed',
	'unauthenticated',
	'not_found',
	'auth_failed'
] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

/** An action's refusal in the API's `{ error, code }` shape, with whatever the form hands back. */
export function failure<T extends object = Record<never, never>>(
	status: number,
	code: FailureCode,
	error: string,
	extra?: T
) {
	return fail(status, { ...(extra as T), error, code });
}

/** What a form whose session lapsed says, ending with what to do once logged in again. */
export const SESSION_ENDED = (retry: 'save again' | 'delete again' | 'try again') =>
	`Your session ended. Log in in another tab, then ${retry}.`;

/** Narrows to a signed-in user; anyone else is sent to log in and brought back to `url`. */
export function requireUser<U>(url: URL, user: U): asserts user is NonNullable<U> {
	if (!user) throw redirect(303, loginHref(url.pathname + url.search));
}
