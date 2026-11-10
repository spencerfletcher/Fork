import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/helpers.js';
import { failure } from '#lib/server/actions.js';

export const load: PageServerLoad = async () => ({ meta: { title: 'Forgot your password?' } });

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email').trim();

		if (!email) {
			return failure(400, 'invalid', 'Enter your email.');
		}

		// Supabase's own recovery flow: it answers the same for an unknown address,
		// so the page never says whether an account exists.
		const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/reset-password`
		});

		if (err) {
			return failure(
				err.status || 500,
				'auth_failed',
				'Could not send the link. Try again in a minute.'
			);
		}

		return { sent: true, email };
	}
};
