/** The login page, carrying the path to return to after logging in, if any. */
export function loginHref(path: string | null): string {
	return path ? `/login?redirectTo=${encodeURIComponent(path)}` : '/login';
}
