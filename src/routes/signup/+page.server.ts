import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/helpers.js';
import { failure } from '#lib/server/actions.js';
import { ensureProfile, usernameTaken } from '#lib/server/profiles.js';
import { localPath } from '#lib/server/localPath.js';
import { CONFIRM_COOKIE, confirmLink, rememberAddress } from '#lib/server/confirmEmail.js';
import {
	USERNAME_MESSAGE,
	USERNAME_TAKEN,
	normalizeUsername,
	validUsername
} from '#lib/auth/rules.js';

// Redirect users who are already logged in away from the signup page, to where
// they were headed or home. A redirectTo from the login page is kept so "Log in"
// can hand it back. Sent back from confirm-email's "Sign up again", the address
// the link went to fills the form, so a mistyped one can be fixed.
export const load: PageServerLoad = async ({ locals: { user }, url, cookies }) => {
	const redirectTo = localPath(url.searchParams.get('redirectTo'));
	if (user) {
		throw redirect(303, redirectTo ?? '/');
	}
	return {
		redirectTo,
		email: cookies.get(CONFIRM_COOKIE) ?? null,
		meta: { title: 'Create an account' }
	};
};

export const actions: Actions = {
	default: async ({ request, url, cookies, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email');
		const username = normalizeUsername(text(formData, 'username'));
		const password = text(formData, 'password');

		if (!email || !password) {
			return failure(400, 'invalid', 'Email and password are required.');
		}
		if (!validUsername(username)) {
			return failure(400, 'invalid', USERNAME_MESSAGE, { field: 'username' });
		}
		// Checked before the auth user exists, so a taken handle costs nothing;
		// ensureProfile still suffixes on the rare race between here and the insert.
		if (await usernameTaken(username)) {
			return failure(400, 'invalid', USERNAME_TAKEN, { field: 'username' });
		}

		const { data, error: err } = await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: confirmLink(url.origin) }
		});

		// An address that already has an account ends as a new one does, on the
		// check-your-inbox page, so a stranger cannot learn who has signed up.
		// Supabase says "already registered" with confirmations off; with them on,
		// it answers with a stand-in user that has no identities.
		const registered = err
			? /already registered/i.test(err.message)
			: data.user?.identities?.length === 0;
		if (err && !registered) {
			return failure(err.status || 500, 'auth_failed', 'Could not create the account. Try again.');
		}

		// Best effort: the email may not be confirmed yet, but the profile row can exist.
		if (data.user && !registered) await ensureProfile(data.user, username);

		// The confirm page names the address; a cookie keeps it out of the URL.
		rememberAddress(cookies, email);

		// The form posts to its own URL, so the login page's redirectTo rides on to
		// confirm-email's Log in.
		const redirectTo = localPath(url.searchParams.get('redirectTo'));
		throw redirect(
			303,
			redirectTo ? `/confirm-email?redirectTo=${encodeURIComponent(redirectTo)}` : '/confirm-email'
		);
	}
};
