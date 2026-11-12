import {
	CONTACT_MAX,
	fileLinkReport,
	LINK_MAX,
	REPORT_ERRORS
} from '#lib/server/moderation.js';
import { MAX_REPORT, REPORT_HONEYPOT } from '#lib/moderation.js';
import { rateLimited } from '#lib/server/rateLimit.js';
import { ensureProfile } from '#lib/server/profiles.js';
import { failure } from '#lib/server/actions.js';
import { text } from '#lib/helpers.js';
import { privatePage } from '#lib/seo.js';
import type { Actions, PageServerLoad } from './$types';

// A report form anyone can send, signed in or not: rights holders and people
// in photos are often not cooks on Fork. Moderators read it at /moderation.

export const load: PageServerLoad = async ({ locals: { user } }) => ({
	// A cook's own address to start from; it never goes into a URL.
	contact: user?.email ?? '',
	caps: { link: LINK_MAX, what: MAX_REPORT, contact: CONTACT_MAX },
	meta: privatePage('Report a problem')
});

type Field = keyof typeof REPORT_ERRORS;

/** The path and query of a link to a page on this site (a bare path counts), or null. Never fetched. */
function pathOnFork(typed: string, origin: string): string | null {
	try {
		const url = new URL(typed, typed.startsWith('/') ? origin : undefined);
		return url.origin === origin ? url.pathname + url.search : null;
	} catch {
		return null;
	}
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, url, locals: { user } }) => {
		const form = await request.formData();
		// A filled trap is a bot: it is thanked like anyone and nothing is kept.
		if (text(form, REPORT_HONEYPOT)) return { sent: true };

		const values = {
			link: text(form, 'link'),
			what: text(form, 'what'),
			contact: text(form, 'contact')
		};
		const link = values.link.trim();
		const what = values.what.trim();
		const contact = values.contact.trim().toLowerCase();
		const path = pathOnFork(link, url.origin);

		const errors: Partial<Record<Field, string>> = {};
		if (!link) errors.link = REPORT_ERRORS.link.missing;
		else if (link.length > LINK_MAX) errors.link = REPORT_ERRORS.link.tooLong;
		else if (!path) errors.link = REPORT_ERRORS.link.notFork;
		if (!what) errors.what = REPORT_ERRORS.what.missing;
		else if (what.length > MAX_REPORT) errors.what = REPORT_ERRORS.what.tooLong;
		if (!contact) errors.contact = REPORT_ERRORS.contact.missing;
		else if (contact.length > CONTACT_MAX || !EMAIL_SHAPE.test(contact))
			errors.contact = REPORT_ERRORS.contact.invalid;

		const first = Object.values(errors)[0];
		if (first || !path)
			return failure(400, 'invalid', first ?? REPORT_ERRORS.link.notFork, { errors, values });

		const limited = user
			? await rateLimited('reports', user.id)
			: await rateLimited('linkReports', null);
		if (limited) return failure(429, 'rate_limited', limited, { values });

		if (user) await ensureProfile(user);
		await fileLinkReport(user?.id ?? null, path, contact, what);
		return { sent: true };
	}
};
