import { error } from '@sveltejs/kit';
import { isModerator, linkReportList, moderationList } from '#lib/server/moderation.js';
import { privatePage } from '#lib/seo.js';
import type { PageServerLoad } from './$types';

// Moderators only, by an explicit check: anyone else gets the 404 of an
// address with no page, so the route does not say it exists. Hide and Restore
// post to the recipe page's own actions, which check again.
export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!isModerator(user)) throw error(404, 'Not Found');
	const [recipes, links] = await Promise.all([moderationList(), linkReportList()]);
	return { recipes, links, meta: privatePage('Moderation') };
};
