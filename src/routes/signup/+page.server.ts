import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/recipes/validation.js';
import { ensureProfile, usernameTaken } from '#lib/server/profiles.js';
import { localPath } from '#lib/server/localPath.js';

// Redirect users who are already logged in away from the signup page. A
// redirectTo from the login page is kept so "Log in" can hand it back.
export const load: PageServerLoad = async ({ locals: { user }, url }) => {
	if (user) {
		throw redirect(303, '/');
	}
	return {
		redirectTo: localPath(url.searchParams.get('redirectTo')),
		meta: { title: 'Create an account' }
	};
};

// The handle is a URL segment and a byline: lowercase, URL-safe, bounded.
const USERNAME = /^[a-z0-9_-]{3,30}$/;

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email');
		const username = text(formData, 'username').trim().toLowerCase();
		const password = text(formData, 'password');

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required.' });
		}
		if (!USERNAME.test(username)) {
			return fail(400, {
				errors: { username: 'Usernames are 3 to 30 characters: letters, digits, - or _' }
			});
		}
		// Checked before the auth user exists, so a taken handle costs nothing;
		// ensureProfile still suffixes on the rare race between here and the insert.
		if (await usernameTaken(username)) {
			return fail(400, { errors: { username: 'That username is taken' } });
		}

		const { data, error: err } = await supabase.auth.signUp({ email, password });

		if (err) {
			const registered = /already registered/i.test(err.message);
			return fail(err.status || 500, {
				message: registered
					? 'That email already has an account.'
					: 'Could not create the account. Try again.',
				registered
			});
		}

		// Best effort: the email may not be confirmed yet, but the profile row can exist.
		if (data.user) await ensureProfile(data.user, username);

		// By default, Supabase sends a confirmation email.
		throw redirect(303, '/confirm-email');
	}
};
