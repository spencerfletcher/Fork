import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/recipes/validation.js';

const meta = { title: 'Reset password' };

/**
 * Set when the emailed link is traded for a session, so the password form is
 * offered only to someone who came through the link, not to whoever is signed
 * in on a shared device. Fifteen minutes is the link's own order of life.
 */
export const RECOVERY_COOKIE = 'pw-reset';
const RECOVERY_COOKIE_OPTIONS = {
	path: '/reset-password',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: 15 * 60
} as const;

// The emailed link lands here with a PKCE `code` (Supabase's default template)
// or a `token_hash` (the template that also works on another device). Either is
// traded for a session, then dropped from the address so a reload cannot replay it.
export const load: PageServerLoad = async ({ url, cookies, locals: { supabase, user } }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');

	if (code || tokenHash) {
		const { error } = code
			? await supabase.auth.exchangeCodeForSession(code)
			: await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash! });
		if (!error) {
			cookies.set(RECOVERY_COOKIE, '1', RECOVERY_COOKIE_OPTIONS);
			throw redirect(303, '/reset-password');
		}
		return { linkValid: false, meta };
	}

	return { linkValid: user !== null && cookies.get(RECOVERY_COOKIE) === '1', meta };
};

export const actions: Actions = {
	default: async ({ request, cookies, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const password = text(formData, 'password');

		// The sign-up's minimum.
		if (password.length < 6) {
			return fail(400, { message: 'Use at least 6 characters.' });
		}
		if (!user || cookies.get(RECOVERY_COOKIE) !== '1') {
			return fail(401, { message: 'This link has expired. Ask for a new one.' });
		}

		const { error: err } = await supabase.auth.updateUser({ password });

		if (err) {
			return fail(err.status || 500, {
				message:
					err.code === 'same_password'
						? "That's your current password. Choose a new one."
						: 'Could not set the password. Try again.'
			});
		}

		// The link is spent; the recovery session is a full session, so the cook
		// is signed in.
		cookies.delete(RECOVERY_COOKIE, { path: RECOVERY_COOKIE_OPTIONS.path });
		throw redirect(303, '/');
	}
};
