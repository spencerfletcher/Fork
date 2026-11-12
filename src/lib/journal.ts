// Journal and Friends words and dates, shared by the server and the pages.
import type { LogAudience } from '#lib/server/db/schema.js';
import { formatDate } from '#lib/helpers.js';

/** One sentence under each choice of "Who sees this entry". */
export const AUDIENCE_SENTENCE: Record<LogAudience, string> = {
	private: 'It stays in your Journal. You can share it later.',
	friends: 'Your friends see it in Friends.'
};

/** The longest page link an entry may carry, as a URL's practical limit. */
export const MAX_LINK = 2048;

/**
 * The recipe field's value that keeps an edited entry's stored source as it is.
 * The colon is one slugify strips, so no recipe slug can equal it.
 */
export const KEEP_SOURCE = ':keep';

/** Under the choices when the linked recipe is Only me and Friends is chosen. */
export const PRIVATE_RECIPE_HINT = 'Friends see the dish and your photo, not the recipe.';

/** Under Block, wherever it is offered. */
export const BLOCK_SENTENCE =
	'Blocking stops requests and interactions. Public recipes stay public.';

// cooked_on is a calendar day with no time zone; read and printed as UTC so
// no reader's offset moves it to the day before.
export const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** "Sun 8 Nov", with the year only when it is not this year's. A Date reads as its UTC day. */
export function dayLabel(value: string | Date, now: Date = new Date()): string {
	const date = typeof value === 'string' ? day(value) : value;
	const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
	return (
		formatDate(date, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			...(sameYear ? {} : { year: 'numeric' }),
			timeZone: 'UTC'
		})
			.replace(',', '')
			// No-break spaces, so a date never wraps mid-way ("Wed 11 / Nov").
			.replaceAll(' ', '\u00a0')
	);
}

/** A journal entry's recipe link, pinned to the version cooked when there is one. */
export function sourceHref(source: { slug: string; versionNumber: number | null }): string {
	return `/recipes/${source.slug}${source.versionNumber ? `?version=${source.versionNumber}` : ''}`;
}

/** The day of the month and its weekday, for the Journal's margin: ["8", "Sun"]. */
export function marginDay(iso: string): [string, string] {
	const date = day(iso);
	return [String(date.getUTCDate()), formatDate(date, { weekday: 'short', timeZone: 'UTC' })];
}

/** "November 2026", the Journal's month heading. */
export function monthLabel(iso: string): string {
	return formatDate(day(iso), { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Entries in order, split where the month changes. */
export function groupByMonth<T extends { cookedOn: string }>(
	entries: T[]
): { month: string; entries: T[] }[] {
	const groups: { month: string; entries: T[] }[] = [];
	for (const entry of entries) {
		const month = monthLabel(entry.cookedOn);
		const last = groups.at(-1);
		if (last?.month === month) last.entries.push(entry);
		else groups.push({ month, entries: [entry] });
	}
	return groups;
}

/** How many calendar months the Journal's summary covers, the current one last. */
export const SUMMARY_MONTHS = 12;

/**
 * The first day of each month the summary covers, oldest first, ending with
 * the month of `today` (a YYYY-MM-DD day): on 2026-11-12, 2025-12-01 to 2026-11-01.
 */
export function summaryMonths(today: string): string[] {
	const [year, month] = [day(today).getUTCFullYear(), day(today).getUTCMonth()];
	return Array.from({ length: SUMMARY_MONTHS }, (_, i) =>
		new Date(Date.UTC(year, month - SUMMARY_MONTHS + 1 + i, 1)).toISOString().slice(0, 10)
	);
}

/** How many recipes the Journal's summary lists. */
export const MOST_COOKED = 5;

/** The marigold steps a cooked month's cell can take, above the bare one for none. */
export const TONE_STEPS = 3;

/**
 * A month's step on the summary's count scale, relative to the window's
 * busiest month: 0 for none cooked, else 1 to TONE_STEPS by even shares of `most`.
 */
export function monthTone(cooks: number, most: number): number {
	if (!cooks) return 0;
	return Math.ceil((cooks / most) * TONE_STEPS);
}

/** Today as the reader's own calendar has it, for the date field's default. */
export function localToday(now: Date = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
