/** The four places the app is organised around, in bar order, Discover first (decided 9 November 2026). */
export const DESTINATIONS = [
	{ href: '/discover', label: 'Discover' },
	{ href: '/cookbook', label: 'Cookbook' },
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
