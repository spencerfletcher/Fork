import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals: { supabase } }) => {
		// This signs the user out and clears their session cookie.
		await supabase.auth.signOut();

		// Redirect the user to the homepage after they log out.
		throw redirect(303, '/');
	}
};
