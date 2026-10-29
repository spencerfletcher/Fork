import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/recipes/validation.js';

// Add a load function to redirect logged-in users away from the login page.
// If a user with an active session tries to visit /login, they'll be
// sent to their profile page instead.
export const load: PageServerLoad = async ({ locals: { user }, url }) => {
	if (user) {
		throw redirect(303, '/'); // Or wherever you want logged-in users to go
	}
	return { redirectTo: localPath(url.searchParams.get('redirectTo')), meta: { title: 'Sign in' } };
};

// Only a path on this site: no scheme, no host, no protocol-relative "//".
function localPath(value: string | null): string | null {
	return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email');
		const password = text(formData, 'password');

		// Basic validation
		if (!email || !password) {
			return fail(400, { message: 'Email and password are required.' });
		}

		// Use the Supabase client to sign the user in
		const { error: err } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		// Supabase's raw message ("Invalid login credentials") never reaches the
		// page: the site speaks in its own sentences.
		if (err) {
			const message =
				err.code === 'invalid_credentials' || err.message === 'Invalid login credentials'
					? "That email and password don't match."
					: 'Could not sign in. Try again.';
			return fail(401, { message });
		}

		// Back to the page that sent them here, or home.
		throw redirect(303, localPath(text(formData, 'redirectTo')) ?? '/');
	}
};
