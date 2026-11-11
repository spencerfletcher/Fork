import type { Cookies } from '@sveltejs/kit';
import { plural } from '#lib/helpers.js';

/**
 * The address a confirmation link went to, so /confirm-email can name it
 * without putting it in a URL. httpOnly and an hour, the link's own life; path
 * `/` so sign-up can read it back when the cook fixes a mistyped address.
 */
export const CONFIRM_COOKIE = 'confirm-email';
const CONFIRM_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: 60 * 60
} as const;

export const rememberAddress = (cookies: Cookies, email: string) =>
	cookies.set(CONFIRM_COOKIE, email, CONFIRM_COOKIE_OPTIONS);

export const forgetAddress = (cookies: Cookies) =>
	cookies.delete(CONFIRM_COOKIE, { path: CONFIRM_COOKIE_OPTIONS.path });

/** Where a confirmation email's link lands: the hosted project must allow-list it. */
export const confirmLink = (origin: string) => `${origin}/confirm-email`;

/**
 * Supabase's 429 for mail: its per-address interval names the seconds left
 * ("…only request this after 42 seconds."); the hourly cap names none.
 */
export function resendWait(message: string): string {
	const seconds = /(\d+) seconds?/.exec(message)?.[1];
	return seconds
		? `Wait ${plural(Number(seconds), 'second')} before asking again.`
		: "We've sent too many emails for now. Try again in an hour.";
}
