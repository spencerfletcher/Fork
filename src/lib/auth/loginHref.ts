/** An auth page, carrying the path to return to afterwards, if any. */
export function authHref(page: '/login' | '/signup', redirectTo: string | null): string {
	return redirectTo ? `${page}?redirectTo=${encodeURIComponent(redirectTo)}` : page;
}

/** The login page, carrying the path to return to after logging in, if any. */
export const loginHref = (redirectTo: string | null) => authHref('/login', redirectTo);
