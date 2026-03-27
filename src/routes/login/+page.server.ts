import {error, redirect} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';

// Add a load function to redirect logged-in users away from the login page.
// If a user with an active session tries to visit /login, they'll be
// sent to their profile page instead.
export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (user) {
		throw redirect(303, '/'); // Or wherever you want logged-in users to go
	}
};

export const actions: Actions = {
	default: async ({request, locals: {supabase}}) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Basic validation
		if (!email || !password) {
			return error(400, {message: 'Email and password are required.'});
		}

		// Use the Supabase client to sign the user in
		const {error: err} = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		// If Supabase returns an error (e.g., wrong password),
		// send it back to the page to be displayed to the user.
		if (err) {
			return error(401, {message: err.message});
		}

		// If login is successful, redirect the user to the homepage or their dashboard
		throw redirect(303, '/');
	},
};
