// The varied seed's shapes: plain data, written by hand in this folder and
// inserted by load.ts. Every date is a number of days before the run, so the
// Journal's twelve months, the Trash's 30 days and "new" activity hold
// whenever the seed runs; the content itself never depends on the day.
import type { SeedUsername, SeedVersion } from '../seedData.js';
import type { Visibility } from '../../../recipes/validation.js';
import type { LogAudience } from '../schema.js';
import type { NotificationKind } from '../../../notifications.js';
import type { Measurement } from '../../../measurement.js';
import type { VariedCook } from './cooks.js';

/** Any seeded cook: the base three or the varied ones. */
export type Cook = SeedUsername | VariedCook;

/** A version's content as typed in the editor: ingredient and step text, `# Group` lines and all. */
export type Content = Omit<SeedVersion, 'commitMessage' | 'createdAt'>;

/** A version after the first: only what changed from the one before, why, and when. */
export type Change = Partial<Content> & { message: string; daysAgo: number };

/** A version that brings back version `restore`'s content, as Restore does ("Restore v2"). */
export type Restore = { restore: number; daysAgo: number };

export type VariedRecipe = {
	/** Unique across the seed (the base's slug prefixes included); the slug's base. */
	key: string;
	author: Cook;
	/** Its tags now. */
	tags: string[];
	/** Its audience now. */
	visibility: Visibility;
	/** Created, or forked, this many days before the run. */
	daysAgo: number;
	/** An original's first version, in full. */
	first?: Content;
	/** A fork's parent (a recipe key) and the version it copied; its v1 is that version's content. */
	forkOf?: { key: string; version: number };
	/** Versions 2 onwards, oldest first. */
	changes?: (Change | Restore)[];
	/** Tags changed on their own (no version) this many days ago: a settings save. */
	tagsEditedDaysAgo?: number;
	/** It had `from` until this many days ago, then went private (savers who could see it keep copies). */
	withdrawn?: { from: Visibility; daysAgo: number };
	/** Moved to the Trash this many days ago. */
	trashedDaysAgo?: number;
	/** Hidden by a moderator this many days ago. */
	hiddenDaysAgo?: number;
};

/** Every field null but the ones given: what a version says when it has no source, notes or times. */
export function content(
	c: Pick<Content, 'title' | 'ingredientsText' | 'stepsText'> & Partial<Content>
): Content {
	return {
		description: null,
		servings: null,
		makes: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null,
		restTimeMinutes: null,
		sourceName: null,
		sourceUrl: null,
		notes: null,
		makeAhead: null,
		equipment: null,
		storage: null,
		reheating: null,
		imageUrl: null,
		...c
	};
}

export type VariedFriendship = {
	from: Cook;
	to: Cook;
	/** Pending: `from` asked. Blocked: `from` blocked `to`. */
	status: 'pending' | 'accepted' | 'blocked';
	daysAgo: number;
	acceptedDaysAgo?: number;
};

export type VariedSave = {
	cook: Cook;
	recipe: string;
	daysAgo: number;
	/** Keep this version; absent follows the latest. */
	keep?: number;
	note?: string;
};

export type VariedCollection = { cook: Cook; name: string; recipes: string[] };

export type VariedEntry = {
	cook: Cook;
	/** A recipe key; absent for an improvised or outside dish. */
	recipe?: string;
	/** The version cooked; when absent, the latest on the day it was cooked. */
	version?: number;
	dish: string;
	daysAgo: number;
	/** The servings cooked, a scale when it differs from the recipe's. */
	servings: number | null;
	caption: string | null;
	/** The cook's private next-time note. */
	note: string | null;
	audience: LogAudience;
	/** For a dish from an outside page. */
	sourceUrl?: string;
	likedBy?: { cook: Cook; daysAgo: number }[];
};

export type VariedReport =
	| { by: Cook | null; target: 'recipe'; recipe: string; reason: string; daysAgo: number }
	| { by: Cook | null; target: 'user'; cook: Cook; reason: string; daysAgo: number }
	| {
			by: Cook | null;
			target: 'log_entry';
			entryOf: Cook;
			dish: string;
			reason: string;
			daysAgo: number;
	  }
	| {
			by: Cook | null;
			target: 'link';
			/** A path on Fork, or a seeded recipe's page. */
			path: string | { recipe: string };
			contact: string;
			reason: string;
			daysAgo: number;
	  };

/** `muter` no longer sees `muted`'s feed items. */
export type VariedMute = { muter: Cook; muted: Cook; daysAgo: number };

export type VariedProfile = {
	cook: Cook;
	measurement?: Measurement;
	defaultVisibility?: Visibility;
	muted?: NotificationKind[];
	/** Last looked at notifications this many days ago. */
	seenDaysAgo?: number;
	/** Starter collections made this many days ago. */
	startersDaysAgo?: number;
	/** Names given up, with how many days ago. */
	former?: { username: string; daysAgo: number }[];
};
