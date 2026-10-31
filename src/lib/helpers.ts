/**
 * Converts a string into a URL-friendly slug.
 * e.g. "Classic Chocolate Chip Cookies" → "classic-chocolate-chip-cookies"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // remove non-word chars (except spaces and hyphens)
		.replace(/[\s_]+/g, '-') // spaces/underscores → hyphens
		.replace(/--+/g, '-') // collapse multiple hyphens
		.replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/** Minutes for display: "45 min", "1h", "1h 30m". */
export function formatTime(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** A date in the site's one locale, en-GB: "28 Feb 2026" unless other parts are asked for. */
export function formatDate(
	date: Date,
	options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
	return date.toLocaleDateString('en-GB', options);
}

/** Eight URL-safe random characters, appended to slugs so titles need not be unique. */
export function randomSuffix(): string {
	return crypto.randomUUID().slice(0, 8);
}
