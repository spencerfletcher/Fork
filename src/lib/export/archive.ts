// The shape of a cook's export: the one source for the JSON archive, the
// Markdown document made from it, and any future import. Keys are stable;
// a change that breaks a reader bumps EXPORT_VERSION. Dates are ISO strings
// (a Journal day is YYYY-MM-DD). No database ids: a recipe is named by its
// slug and link, which never change.
import type { RecipeContent } from '#lib/recipes/types.js';
import type { Visibility } from '#lib/recipes/validation.js';
import type { LogAudience } from '#lib/server/db/schema.js';

export const EXPORT_FORMAT = 'fork-export';
export const EXPORT_VERSION = 1;

/** The two downloads: the structured archive and the readable document. */
export const EXPORT_FORMATS = ['json', 'md'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export const FORMAT_LABEL: Record<ExportFormat, string> = { json: 'JSON', md: 'Markdown' };

/** Another record's pointer at a recipe: its slug, link, title and its author's handle (null for a deleted account). */
export type RecipeRef = { slug: string; url: string; title: string; author: string | null };

/** One version, exactly as stored: `content` is the RecipeContent the editor saved; a fork's v1 `message` is its line from the parent (`forkedFromLine`). */
export type ExportVersion = {
	number: number;
	date: string;
	message: string;
	content: RecipeContent;
};

export type ExportRecipe = {
	slug: string;
	url: string;
	audience: Visibility;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	/** When it went to the Trash; null for a live recipe. */
	inTrashSince: string | null;
	/**
	 * The recipe it was forked from, and the version copied (null for a fork from
	 * before that was recorded); 'deleted' when that is gone, 'hidden' when the
	 * cook may no longer see it.
	 */
	forkedFrom: (RecipeRef & { version: number | null }) | 'deleted' | 'hidden' | null;
	/** Oldest first; photos are each version's `content.imageUrl`. */
	versions: ExportVersion[];
};

/** A saved recipe by another cook: a reference, never its content. */
export type ExportSave = RecipeRef & {
	savedAt: string;
	/** The version the cook chose to keep opening; null follows the latest. */
	keptVersion: number | null;
	/** The version kept as a read-only copy after the author withdrew it; its content is not exported. */
	keptCopy: number | null;
	note: string | null;
};

export type ExportCollection = {
	name: string;
	createdAt: string;
	recipes: (RecipeRef & { addedAt: string })[];
};

export type JournalSource =
	| { kind: 'recipe'; slug: string; url: string; title: string; version: number | null }
	| { kind: 'link'; url: string }
	| { kind: 'improvised' }
	| { kind: 'deleted' }
	| { kind: 'hidden' };

export type ExportJournalEntry = {
	cookedOn: string;
	dish: string;
	source: JournalSource;
	servings: number | null;
	caption: string | null;
	note: string | null;
	photoUrl: string | null;
	audience: LogAudience;
};

export type ForkExport = {
	format: typeof EXPORT_FORMAT;
	version: typeof EXPORT_VERSION;
	exportedAt: string;
	/** The whole library, or one recipe (collections, saves and journal then empty). */
	scope: 'library' | 'recipe';
	profile: { username: string; url: string; avatarUrl: string | null; joinedAt: string };
	recipes: ExportRecipe[];
	collections: ExportCollection[];
	saves: ExportSave[];
	journal: ExportJournalEntry[];
};

/** Where a download is asked for: the whole library from Settings, or one recipe by its owner. */
export function exportHref(format: ExportFormat, slug?: string): string {
	return `${slug ? `/recipes/${encodeURIComponent(slug)}` : '/settings'}/export?format=${format}`;
}

/** "fork-export-cook-2026-11-11.json", or with the recipe's slug before the day. */
export function exportFilename(ex: ForkExport, format: ExportFormat): string {
	const slug = ex.scope === 'recipe' ? `-${ex.recipes[0].slug}` : '';
	return `fork-export-${ex.profile.username}${slug}-${ex.exportedAt.slice(0, 10)}.${format}`;
}
