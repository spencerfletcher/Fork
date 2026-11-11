import * as env from '$app/env/private';
import type { Viewer } from './visibility.js';

/**
 * The viewer is a moderator: their user id is one of MODERATOR_IDS, a
 * comma-separated list of auth user ids in the server's environment. Empty or
 * unset means nobody. Read on every call, so a test or a restart sees a change.
 */
export function isModerator(user: Viewer): boolean {
	if (!user?.id) return false;
	return (env.MODERATOR_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.includes(user.id);
}
