import {error, redirect} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';

// Redirect users who are already logged in away from the signup page.
export const load: PageServerLoad = async ({locals: {user}}) => {
	if (user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({request, locals: {supabase}}) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			throw error(400, {message: 'Email and password are required.'});
		}

		// Use the Supabase client to sign up a new user
		const {error: err} = await supabase.auth.signUp({
			email,
			password,
		});

		if (err) {
			throw error(err.status || 500, {message: err.message});
		}

		// By default, Supabase sends a confirmation email.
		// Redirect to a page that tells the user to check their email.
		throw redirect(303, '/confirm-email');
	},
};