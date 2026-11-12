import { db } from '#lib/server/db/index.js';
import { profiles } from '#lib/server/db/schema.js';
import { unseenCount } from '#lib/server/notifications.js';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals: { user } }) => {
	// Read so SvelteKit reruns this on every page: the dot by Friends goes out
	// on the navigation after Friends marked everything seen.
	void url.pathname;
	if (!user) return { user: null, profile: null, unseen: false };
	// unseenCount is the profile's muted kinds, then the five kinds' reads in
	// parallel, each on an index that starts with the cook.
	const [profile, unseen] = await Promise.all([
		db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
		unseenCount(user)
	]);
	// The id, and the email the Navbar falls back on before a profile exists.
	return {
		user: { id: user.id, email: user.email },
		profile: profile ?? null,
		// Whether anything on Friends is newer than the cook last looked there.
		unseen: unseen > 0
	};
};
