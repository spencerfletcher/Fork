import type {Handle} from '@sveltejs/kit';
import {createServerClient} from '@supabase/ssr';
import {paraglideMiddleware} from '$lib/paraglide/server';
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY} from '$env/static/public';

export const handle: Handle = async ({event, resolve}) => {
	// --- 1. Supabase Auth Logic (runs first)
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			// This is the new, recommended way to handle cookies.
			getAll: () => {
				return event.cookies.getAll();
			},
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({name, value, options}) => {
					event.cookies.set(name, value, {...options, path: '/'});
				});
			}
		}
	});

	const {
		data: {user}
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user ?? null;

	// --- 2. Paraglide i18n Logic (runs second) ---
	const response = await paraglideMiddleware(event.request, ({request, locale}) => {
		event.request = request;

		// --- 3. Final Resolve ---
		return resolve(event, {
			transformPageChunk: ({html}) => html.replace('%paraglide.lang%', locale),
			// This part from the Supabase hook is important for security
			filterSerializedResponseHeaders(name) {
				return name === 'content-range';
			}
		});
	});

	/* --- 4. Security Headers ---
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"connect-src 'self' https://*.supabase.co",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
		*/

	return response;
};
