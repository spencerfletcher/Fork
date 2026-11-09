import { loadDiscover } from './discover.server.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { user } }) => ({
	...(await loadDiscover(url, user)),
	meta: { title: 'Discover' }
});
