import type { Notification } from './server/notifications.js';

/**
 * What a cook is told about, each of which they can mute in Settings: a friend
 * request to them, their request accepted, a like on their Journal entry, a
 * save of their recipe, a fork of it. Read, never stored, by notificationsFor
 * (#lib/server/notifications.ts).
 */
export const NOTIFICATION_KINDS = ['request', 'accepted', 'like', 'save', 'fork'] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** The most unseen notifications counted (unseenCount); the UI may show it as "99+". */
export const UNSEEN_MAX = 99;

/** The muted kinds a profile stores, in the list's order; anything not a kind (one since removed) is ignored. */
export function mutedKinds(stored: readonly string[]): NotificationKind[] {
	return NOTIFICATION_KINDS.filter((kind) => stored.includes(kind));
}

/** Settings' Notifications section: each kind's word and one sentence. */
export const NOTIFICATION_LABEL: Record<NotificationKind, string> = {
	request: 'Friend requests',
	accepted: 'Requests accepted',
	like: 'Likes on your Journal',
	save: 'Saves of your recipes',
	fork: 'Forks of your recipes'
};

export const NOTIFICATION_NOTE: Record<NotificationKind, string> = {
	request: 'A request waits on Friends either way; this is only the dot.',
	accepted: 'When someone accepts your request.',
	like: 'When someone likes one of your entries.',
	save: 'When someone saves one of your recipes.',
	fork: 'When someone forks one of your recipes.'
};

/** The most rows For you shows besides requests; older new things are left to the feed and the recipes' own counts. */
export const FOR_YOU_ROWS = 6;

/** A For you row: its newest named cook's item, at the group's newest time, and how many other cooks share its target. */
export type Notice = Notification & { others: number };

/** What one row gathers: every accept is one row; a like per entry, a save or fork per recipe. */
function target(n: Notification): string {
	switch (n.kind) {
		case 'request':
			return n.id;
		case 'accepted':
			return 'accepted';
		case 'like':
			return `like-${n.entry.id}`;
		case 'save':
		case 'fork':
			return `${n.kind}-${n.recipe.slug}`;
	}
}

/**
 * The For you band's rows from notificationsFor's newest-first items: only
 * what is unseen, never a request (the band lists requests itself, answered
 * or not), several cooks on one target as one row in the newest one's place,
 * at most FOR_YOU_ROWS.
 */
export function forYou(items: Notification[]): Notice[] {
	const groups = new Map<string, Notification[]>();
	for (const n of items) {
		if (!n.unseen || n.kind === 'request') continue;
		const key = target(n);
		groups.set(key, [...(groups.get(key) ?? []), n]);
	}
	return [...groups.values()].slice(0, FOR_YOU_ROWS).map((group) => {
		const lead = group.find((n) => n.username) ?? group[0];
		// A cook gone from Fork is no one to name, so each counts once by its item.
		const cooks = new Set(group.map((n) => n.username ?? n.id)).size;
		return { ...lead, at: group[0].at, others: cooks - 1 };
	});
}
