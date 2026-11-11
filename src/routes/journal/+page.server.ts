import { ENTRIES_PER_PAGE, journalOf, journalSummary, ownEntry } from '#lib/server/journal.js';
import { requireUser } from '#lib/server/actions.js';
import { wholeNumber } from '#lib/helpers.js';
import { listPage } from '#lib/listPage.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);
	const [{ entries, next }, { total, oldest }] = await Promise.all([
		journalOf(user, listPage(url, ENTRIES_PER_PAGE)),
		journalSummary(user.id)
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
		logged: logged && { cookedOn: logged.cookedOn },
		meta: { title: 'Journal' }
	};
};
