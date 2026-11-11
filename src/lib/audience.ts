// Who can see a recipe or a Journal entry, in words. A Journal entry's
// audience is a subset (Only me, Friends), so one table serves both.
import type { Visibility } from '#lib/recipes/validation.js';

/** Each audience's name, always shown beside its icon. */
export const AUDIENCE_LABEL: Record<Visibility, string> = {
	private: 'Only me',
	friends: 'Friends',
	public: 'Public'
};

/** A recipe audience's one sentence, under its word in the editor and Settings. */
export const AUDIENCE_NOTE: Record<Visibility, string> = {
	private: 'Only you can see it. You can share it later.',
	friends: 'Approved friends can see, save and fork it. It stays out of Discover.',
	public: 'Anyone can find, save and fork it.'
};
