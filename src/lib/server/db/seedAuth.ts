// The seed's reads of Supabase Auth, kept pure so the paging is tested.
export type AuthUser = { id: string; email?: string };

/**
 * Every auth user, `perPage` at a time, until a page comes back short.
 * listUsers() alone returns the first 50, and a seed user past them was
 * missed, so the seed wiped the database and then failed to recreate it.
 */
export async function allAuthUsers(
	listPage: (page: number, perPage: number) => Promise<AuthUser[]>,
	perPage = 1000
): Promise<AuthUser[]> {
	const all: AuthUser[] = [];
	for (let page = 1; ; page++) {
		const users = await listPage(page, perPage);
		all.push(...users);
		if (users.length < perPage) return all;
	}
}
