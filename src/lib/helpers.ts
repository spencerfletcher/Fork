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
