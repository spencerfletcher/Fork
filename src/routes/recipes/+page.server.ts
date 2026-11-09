import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// My Recipes merged into the Cookbook (decision pack, 9 November 2026).
export const load: PageServerLoad = () => {
	throw redirect(301, '/cookbook');
};
