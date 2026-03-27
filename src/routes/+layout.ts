import {createBrowserClient} from '@supabase/ssr';
import type {LayoutLoad} from './$types';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

export const load: LayoutLoad = async ({ data, fetch, depends }) => {
	depends('supabase:auth');

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
	});

	// Use the server-verified user from layout.server.ts instead of calling
	// getSession() here, which would trigger the "insecure user object" warning
	// during SSR and is unnecessary since auth transitions are server-driven.
	return { supabase, user: data.user };
};