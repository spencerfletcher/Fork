import type { Actions } from './$types';
import { signedOut } from '#lib/server/actions.js';
import { markSeen } from '#lib/server/notifications.js';

// No page yet: where notifications show is the UI's to decide. A form post,
// so SvelteKit's origin check guards it; nothing submitted names a profile.
export const actions: Actions = {
	seen: async ({ locals: { user } }) => {
		if (!user) return signedOut();
		await markSeen(user.id);
		return { seen: true as const };
	}
};
