import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { profiles } from '#lib/server/db/schema.js';
import { failure, requireUser, signedOut } from '#lib/server/actions.js';
import { changeUsername, ensureProfile } from '#lib/server/profiles.js';
import { oneOf, text } from '#lib/helpers.js';
import { dayLabel } from '#lib/journal.js';
import {
	USERNAME_MESSAGE,
	USERNAME_TAKEN,
	normalizeUsername,
	validUsername
} from '#lib/auth/rules.js';
import { VISIBILITIES } from '#lib/recipes/validation.js';
import { AS_WRITTEN, MEASUREMENTS } from '#lib/measurement.js';

/** Each section is its own form, so a result names the one it belongs to. */
export type Section = 'username' | 'audience' | 'measurement';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	requireUser(url, user);
	await ensureProfile(user);
	const settings = await db.query.profiles.findFirst({
		where: eq(profiles.id, user.id),
		columns: { username: true, defaultVisibility: true, measurement: true }
	});
	return { email: user.email ?? '', settings: settings!, meta: { title: 'Settings', noindex: true } };
};

const saved = (section: Section) => ({ section, saved: true as const });

// Every write is keyed by the signed-in user's id; nothing submitted names a profile.
export const actions: Actions = {
	username: async ({ request, locals: { user } }) => {
		if (!user) return signedOut('save again', { section: 'username' });
		const username = normalizeUsername(text(await request.formData(), 'username'));
		if (!validUsername(username)) {
			return failure(400, 'invalid', USERNAME_MESSAGE, { section: 'username', username });
		}
		const change = await changeUsername(user.id, username);
		if (change.result === 'taken') {
			return failure(400, 'invalid', USERNAME_TAKEN, { section: 'username', username });
		}
		if (change.result === 'too_soon') {
			const error = `You can change your username again on ${dayLabel(change.nextChange)}.`;
			return failure(429, 'rate_limited', error, { section: 'username', username });
		}
		return saved('username');
	},

	audience: async ({ request, locals: { user } }) => {
		if (!user) return signedOut('save again', { section: 'audience' });
		const defaultVisibility = oneOf(
			VISIBILITIES,
			text(await request.formData(), 'defaultVisibility')
		);
		if (!defaultVisibility) {
			return failure(400, 'invalid', 'Choose who new recipes start as.', { section: 'audience' });
		}
		await db.update(profiles).set({ defaultVisibility }).where(eq(profiles.id, user.id));
		return saved('audience');
	},

	// The recipe page converts quantities to it (convertIngredient).
	measurement: async ({ request, locals: { user } }) => {
		if (!user) return signedOut('save again', { section: 'measurement' });
		const raw = text(await request.formData(), 'measurement');
		const measurement = raw === AS_WRITTEN ? null : oneOf(MEASUREMENTS, raw);
		if (measurement === undefined) {
			return failure(400, 'invalid', 'Choose how quantities are shown.', {
				section: 'measurement'
			});
		}
		await db.update(profiles).set({ measurement }).where(eq(profiles.id, user.id));
		return saved('measurement');
	}
};
