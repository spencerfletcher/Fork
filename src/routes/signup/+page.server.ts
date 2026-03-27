import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';

// Redirect users who are already logged in away from the signup page.
export const load: PageServerLoad = async ({ locals: { user } }) => {
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
			return error(400, {message: 'Email and password are required.'});
		}

		// Use the Supabase client to sign up a new user
		const { data, error: err } = await supabase.auth.signUp({ email, password });

		if (err) {
			return error(err.status || 500, { message: err.message });
		}

		// Create a profile row for the new user (best-effort; email may not be confirmed yet)
		if (data.user) {
			await db
				.insert(profiles)
				.values({
					id: data.user.id,
					username: email.split('@')[0],
				})
				.onConflictDoNothing();
		}

		// By default, Supabase sends a confirmation email.
		throw redirect(303, '/confirm-email');
	},
};