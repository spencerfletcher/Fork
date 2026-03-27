import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	// --- 1. Supabase Auth Logic (runs first)
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			// This is the new, recommended way to handle cookies.
			getAll: () => {
				return event.cookies.getAll();
			},
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user ?? null;

	// --- 2. Paraglide i18n Logic (runs second) ---
	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		// --- 3. Final Resolve ---
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
			// This part from the Supabase hook is important for security
			filterSerializedResponseHeaders(name) {
				return name === 'content-range';
			}
		});
	});
};
