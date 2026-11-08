import { localPath } from '#lib/server/localPath.js';
import type { PageServerLoad } from './$types';

// Signup hands on the login page's redirectTo, so Log in can carry it back.
export const load: PageServerLoad = async ({ url }) => ({
	redirectTo: localPath(url.searchParams.get('redirectTo')),
	meta: { title: 'Confirm your email' }
});
