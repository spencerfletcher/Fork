import type { RecipeDraft } from '#lib/recipes/validation.js';

/**
 * Editor drafts kept on this device only, in localStorage, so a reload, a
 * closed tab or a crash loses nothing typed. They never reach the server and
 * never become versions. Every access is guarded: storage can be missing (the
 * server), refused (private mode, blocked site data) or full, and the editor
 * works the same without it.
 */

const PREFIX = 'fork:draft:';

export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type StoredDraft = {
	draft: RecipeDraft;
	savedAt: number;
	/** A photo was chosen; its bytes are not kept, so a restore says so. */
	photoLost: boolean;
	/** The recipe an edit draft changes, for the Cookbook's Drafts list to name and link. */
	recipe?: DraftRecipe;
};

export type DraftRecipe = { slug: string; title: string };

/** One row of the Cookbook's Drafts list; `recipe` is null for the new-recipe draft. */
export type ListedDraft = {
	key: string;
	title: string;
	savedAt: number;
	recipe: DraftRecipe | null;
};

/** One key per signed-in user and recipe ('new' for the new-recipe editor),
 *  so a shared device never shows one cook's draft to another. */
export const draftKey = (userId: string, recipe: string) => `${PREFIX}${userId}:${recipe}`;

/** False when the storage refused it (missing, blocked or full). */
export function saveDraft(key: string, value: StoredDraft): boolean {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

export function clearDraft(key: string) {
	try {
		localStorage.removeItem(key);
	} catch {
		// Nothing stored can be shown either.
	}
}

/** Logging out leaves none of that cook's drafts on the device. */
export function clearDrafts(userId: string) {
	try {
		const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
		for (const k of keys) if (k?.startsWith(`${PREFIX}${userId}:`)) localStorage.removeItem(k);
	} catch {
		// Nothing stored can be shown either.
	}
}

function read(key: string): StoredDraft | null {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
		if (typeof value !== 'object' || value === null) return null;
		const { draft, savedAt, photoLost, recipe } = value as Partial<StoredDraft>;
		if (typeof savedAt !== 'number' || typeof draft !== 'object' || draft === null) return null;
		const linked =
			typeof recipe?.slug === 'string' && typeof recipe.title === 'string'
				? { recipe: { slug: recipe.slug, title: recipe.title } }
				: {};
		return { draft, savedAt, photoLost: photoLost === true, ...linked };
	} catch {
		return null;
	}
}

/** The draft under `key`, after dropping every draft older than 30 days. */
export function loadDraft(key: string, now = Date.now()): StoredDraft | null {
	try {
		const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
		for (const k of keys) {
			if (!k?.startsWith(PREFIX)) continue;
			const value = read(k);
			if (!value || now - value.savedAt > DRAFT_MAX_AGE_MS) localStorage.removeItem(k);
		}
	} catch {
		return null;
	}
	return read(key);
}

/**
 * This user's drafts on the device, newest first: the new-recipe draft, and
 * each edit draft that says which recipe it changes (one stored before that
 * was kept has nothing to link to, so it is left out). Expired or unreadable
 * entries are skipped.
 */
export function listDrafts(userId: string, now = Date.now()): ListedDraft[] {
	const prefix = `${PREFIX}${userId}:`;
	const listed: ListedDraft[] = [];
	try {
		const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
		for (const key of keys) {
			if (!key?.startsWith(prefix)) continue;
			const value = read(key);
			if (!value || now - value.savedAt > DRAFT_MAX_AGE_MS) continue;
			const recipe = key === draftKey(userId, 'new') ? null : value.recipe;
			if (recipe === undefined) continue;
			const title = typeof value.draft.title === 'string' ? value.draft.title : '';
			listed.push({ key, title, savedAt: value.savedAt, recipe });
		}
	} catch {
		return [];
	}
	return listed.sort((a, b) => b.savedAt - a.savedAt);
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "just now", "5 minutes ago", "yesterday", "4 days ago". */
export function draftAge(savedAt: number, now = Date.now()) {
	const minutes = Math.floor((now - savedAt) / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return relative.format(-minutes, 'minute');
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return relative.format(-hours, 'hour');
	return relative.format(-Math.floor(hours / 24), 'day');
}
