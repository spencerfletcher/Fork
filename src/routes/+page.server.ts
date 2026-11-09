import { redirect } from '@sveltejs/kit';
import { loadDiscover } from './discover/discover.server.js';
import type { PageServerLoad } from './$types';

// Signed in, home is your Cookbook. Signed out, it is Discover, under the
// site's branded default title.
export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	if (user) throw redirect(302, '/cookbook');
	return loadDiscover(url, null);
};
