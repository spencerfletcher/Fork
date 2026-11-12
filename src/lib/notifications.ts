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
