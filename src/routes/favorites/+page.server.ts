import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Favorites became the Cookbook's Saved filter (decision pack, 9 November
// 2026); a search and tags carry over.
export const load: PageServerLoad = ({ url }) => {
	const params = new URLSearchParams(url.searchParams);
	params.set('filter', 'saved');
	throw redirect(301, `/cookbook?${params}`);
};
