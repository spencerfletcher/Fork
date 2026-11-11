import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { text } from '#lib/helpers.js';
import { failure } from '#lib/server/actions.js';
import { localPath } from '#lib/server/localPath.js';
import { privatePage } from '#lib/seo.js';
import {
	CONFIRM_COOKIE,
	confirmLink,
	forgetAddress,
	resendWait
} from '#lib/server/confirmEmail.js';

type ConfirmState = 'sent' | 'expired' | 'confirmed';

// The tab reads as the card heads itself.
const TITLES: Record<ConfirmState, string> = {
	sent: 'Check your email',
	expired: 'Link expired',
	confirmed: 'Email confirmed'
};

// The emailed link lands here with a PKCE `code` (Supabase's default template)
// or a `token_hash` (a template that also works on another device); a dead
// link comes back with Supabase's `error_code` instead. Signup hands on the
// login page's redirectTo, so Log in can carry it back.
export const load: PageServerLoad = async ({ url, cookies, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');

	let state: ConfirmState = url.searchParams.has('error_code') ? 'expired' : 'sent';
	if (code || tokenHash) {
		const { error } = code
			? await supabase.auth.exchangeCodeForSession(code)
			: await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash! });
		if (!error) {
			forgetAddress(cookies);
			throw redirect(303, '/');
		}
		// Supabase issues a code only once it has confirmed the address; trading
		// it fails on another device, which lacks the sign-up's code verifier.
		state = code ? 'confirmed' : 'expired';
	}

	return {
		state,
		email: cookies.get(CONFIRM_COOKIE) ?? null,
		redirectTo: localPath(url.searchParams.get('redirectTo')),
		meta: privatePage(TITLES[state])
	};
};

export const actions: Actions = {
	default: async ({ request, url, cookies, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = text(formData, 'email').trim() || cookies.get(CONFIRM_COOKIE) || '';

		if (!email) {
			return failure(400, 'invalid', 'Enter your email.');
		}

		// Supabase answers the same for an unknown or already confirmed address,
		// so the page never says whether an account exists.
		const { error: err } = await supabase.auth.resend({
			type: 'signup',
			email,
			options: { emailRedirectTo: confirmLink(url.origin) }
		});

		if (err) {
			if (err.status === 429) return failure(429, 'rate_limited', resendWait(err.message));
			return failure(
				err.status || 500,
				'auth_failed',
				'Could not send the link. Try again in a minute.'
			);
		}

		return { sent: true, email };
	}
};
