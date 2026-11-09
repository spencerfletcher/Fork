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

/** A count and its noun: "1 fork", "2 forks"; an irregular plural is passed: "2 entries". */
export function plural(n: number, word: string, pluralForm = `${word}s`): string {
	return `${n} ${n === 1 ? word : pluralForm}`;
}

export const THOUSAND = 1_000;
export const MILLION = 1_000_000;

/**
 * A count for a pill: plain digits under a thousand, then one decimal and
 * "k" or "M" with a trailing ".0" dropped ("1.2k", "12k", "2.5M"). Rounds
 * down, so 999,999 reads "999.9k", never "1000k".
 */
export function compactCount(n: number): string {
	if (n < THOUSAND) return String(n);
	const [unit, suffix] = n < MILLION ? [THOUSAND, 'k'] : [MILLION, 'M'];
	return `${Math.floor((n / unit) * 10) / 10}${suffix}`;
}

/** A form field as a string: missing or non-string (a File) reads as empty. */
export function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

/** Eight URL-safe random characters, appended to slugs so titles need not be unique. */
export function randomSuffix(): string {
	return crypto.randomUUID().slice(0, 8);
}

/** `value` when it is one of `list`, else undefined, typed as the list's member. */
export function oneOf<T extends string>(list: readonly T[], value: string | null): T | undefined {
	return list.find((item) => item === value);
}

/** Digits only, as a number; anything else (signs, decimals, "2abc", which parseInt reads as 2) is null. */
export function wholeNumber(value: string): number | null {
	return /^\d+$/.test(value) ? Number(value) : null;
}
