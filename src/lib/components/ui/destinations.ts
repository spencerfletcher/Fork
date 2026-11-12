/** The four places the app is organised around, in bar order, Cookbook first (decided 12 November 2026). */
export const DESTINATIONS = [
	{ href: '/cookbook', label: 'Cookbook' },
	{ href: '/discover', label: 'Discover' },
	{ href: '/journal', label: 'Journal' },
	{ href: '/friends', label: 'Friends' }
] as const;

export type Destination = (typeof DESTINATIONS)[number];

/**
 * Whether `path` is under a destination. Discover also covers the signed-out
 * home (which renders it) and tag pages (Discover filtered by one tag).
 */
export function isCurrent(destination: Destination, path: string): boolean {
	if (destination.href === '/discover' && (path === '/' || path.startsWith('/tags/'))) return true;
	return path === destination.href || path.startsWith(`${destination.href}/`);
}

/**
 * Friends' name while it has something the cook has not seen (`unseen`, the
 * root layout's), else undefined: the bar and the tab bar then draw the dot,
 * which is decoration. Never on Friends itself, which is what clears it.
 */
export function newActivityName(
	destination: Destination,
	path: string,
	unseen: boolean
): string | undefined {
	if (!unseen || destination.href !== '/friends' || isCurrent(destination, path)) return undefined;
	return `${destination.label}, new activity`;
}
