import {createBrowserClient} from '@supabase/ssr';
import type {LayoutLoad} from './$types';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

export const load: LayoutLoad = async ({fetch, depends}) => {
	depends('supabase:auth');

	// Create the browser client
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch,
		},
	});

	// Get the session from the client
	const {
		data: {session},
	} = await supabase.auth.getSession();

	return {supabase, session};
};