import { redirect } from '@sveltejs/kit';
import { journalOf } from '#lib/server/journal.js';
import { loginHref } from '#lib/auth/loginHref.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (!user) throw redirect(303, loginHref(url.pathname + url.search));
	return { entries: await journalOf(user), meta: { title: 'Journal' } };
};
