import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user } }) => {
	let profile = null;
	if (user) {
		profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) });
	}
	return { user, profile };
};
