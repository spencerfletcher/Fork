import {
	ENTRIES_PER_PAGE,
	journalOf,
	journalSummary,
	journalYear,
	ownEntry
} from '#lib/server/journal.js';
import { requireUser } from '#lib/server/actions.js';
import { wholeNumber } from '#lib/helpers.js';
import { listPage } from '#lib/listPage.js';
import type { PageServerLoad } from './$types';
import { privatePage } from '#lib/seo.js';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);
	const slice = listPage(url, ENTRIES_PER_PAGE);
	const [{ entries, next }, { total, oldest }, year] = await Promise.all([
		journalOf(user, slice),
		journalSummary(user.id),
		// Show more fetches the next page by its cursor; the page keeps the year it loaded.
		slice.after ? null : journalYear(user, new Date())
	]);
	// The form lands here with ?logged=<id>; an entry dated long ago may sit past this page.
	const loggedId = wholeNumber(url.searchParams.get('logged') ?? '');
	const logged =
		loggedId === null
			? null
			: (entries.find((e) => e.id === loggedId) ?? (await ownEntry(user, loggedId)));
	return {
		entries,
		next,
		total,
		oldest,
		year,
		logged: logged && { cookedOn: logged.cookedOn },
		meta: privatePage('Journal')
	};
};
