import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/recipes/validation.js';
import { ensureProfile } from '#lib/server/profiles.js';

// Redirect users who are already logged in away from the signup page.
export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email');
		const password = text(formData, 'password');

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required.' });
		}

		const { data, error: err } = await supabase.auth.signUp({ email, password });

		if (err) {
			return fail(err.status || 500, { message: err.message });
		}

		// Best effort: the email may not be confirmed yet, but the profile row can exist.
		if (data.user) await ensureProfile(data.user);

		// By default, Supabase sends a confirmation email.
		throw redirect(303, '/confirm-email');
	}
};
