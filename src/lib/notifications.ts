/**
 * What a cook is told about, each of which they can mute in Settings: a friend
 * request to them, their request accepted, a like on their Journal entry, a
 * save of their recipe, a fork of it. Read, never stored, by notificationsFor
 * (#lib/server/notifications.ts).
 */
export const NOTIFICATION_KINDS = ['request', 'accepted', 'like', 'save', 'fork'] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
