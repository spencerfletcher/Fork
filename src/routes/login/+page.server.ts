import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/helpers.js';
import { failure } from '#lib/server/actions.js';
import { localPath } from '#lib/server/localPath.js';
import { forgetAddress, rememberAddress } from '#lib/server/confirmEmail.js';

// A signed-in visitor has nothing to do here and goes where they were headed, or home.
export const load: PageServerLoad = async ({ locals: { user }, url }) => {
	const redirectTo = localPath(url.searchParams.get('redirectTo'));
	if (user) {
		throw redirect(303, redirectTo ?? '/');
	}
	return { redirectTo, meta: { title: 'Log in' } };
};

export const actions: Actions = {
	default: async ({ request, cookies, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email');
		const password = text(formData, 'password');

		if (!email || !password) {
			return failure(400, 'invalid', 'Email and password are required.');
		}

		// Use the Supabase client to sign the user in
		const { error: err } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		// Supabase's raw message ("Invalid login credentials") never reaches the
		// page: the site speaks in its own sentences.
		if (err) {
			// Supabase says so only once the password matched, so a stranger learns
			// nothing; the confirm page then names the address and can resend.
			if (err.code === 'email_not_confirmed') {
				rememberAddress(cookies, email);
				return failure(401, 'auth_failed', 'Confirm your email first: open the link we sent you.', {
					unconfirmed: true
				});
			}
			const message =
				err.code === 'invalid_credentials' || err.message === 'Invalid login credentials'
					? "That email and password don't match."
					: 'Could not log in. Try again.';
			return failure(401, 'auth_failed', message);
		}

		forgetAddress(cookies);
		// Back to the page that sent them here, or home.
		throw redirect(303, localPath(text(formData, 'redirectTo')) ?? '/');
	}
};
