import { journalOf } from '#lib/server/journal.js';
import { requireUser } from '#lib/server/actions.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);
	return { entries: await journalOf(user), meta: { title: 'Journal', noindex: true } };
};
