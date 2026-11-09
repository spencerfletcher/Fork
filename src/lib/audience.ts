// Who can see a recipe or a Journal entry, in words. A Journal entry's
// audience is a subset (Only me, Friends), so one table serves both.
import type { Visibility } from '#lib/recipes/validation.js';

/** Each audience's name, always shown beside its icon. */
export const AUDIENCE_LABEL: Record<Visibility, string> = {
	private: 'Only me',
	friends: 'Friends',
	public: 'Public'
};
