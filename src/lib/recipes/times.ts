// A recipe's times are typed as words ("1 h 30", "1.5 hours", "overnight")
// and stored as whole minutes. Nothing else is kept, so a time reads back as
// formatDuration writes it: "overnight" is stored, and shown, as 8 h.

/** The time fields: their name in messages, their label on the form, and
 *  the word the measure sets after the value ("15 min prep"). */
export const TIME_FIELDS = {
	prepTimeMinutes: { label: 'Prep time', formLabel: 'Prep', word: 'prep' },
	cookTimeMinutes: { label: 'Cook time', formLabel: 'Cook', word: 'cook' },
	restTimeMinutes: { label: 'Rest time', formLabel: 'Rest', word: 'rest' }
} as const;

export type TimeField = keyof typeof TIME_FIELDS;

/** What "overnight" is stored as. */
export const OVERNIGHT_MINUTES = 8 * 60;
/** The longest time a field takes: 30 days, past any rest or cure a recipe asks for. */
export const MAX_DURATION_MINUTES = 30 * 24 * 60;

export type DurationRead =
	{ ok: true; minutes: number | null } | { ok: false; reason: 'unreadable' | 'tooLong' };

// Largest first: a time names each unit at most once, in this order.
const UNITS = [
	{ minutes: 1440, pattern: /^(days?|d)$/ },
	{ minutes: 60, pattern: /^(hours?|hrs?|h)$/ },
	{ minutes: 1, pattern: /^(minutes?|mins?|m)$/ }
];

// A number and the word after it, if any: "1.5 hours", "30", "2d".
const PART = /(\d+(?:\.\d+)?)\s*([a-z]*)/y;

/** The minutes a typed time names; blank is null. */
export function readDuration(typed: string): DurationRead {
	const text = typed
		.trim()
		.toLowerCase()
		.replace(/(\d),(\d)/g, '$1.$2')
		.replace(/\bhalf an? hour\b/g, '30 min')
		.replace(/\b(an?|one)\b/g, '1')
		.replace(/\band\b|,/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (text === '') return { ok: true, minutes: null };
	if (text === 'overnight') return { ok: true, minutes: OVERNIGHT_MINUTES };

	let total: number;
	const clock = /^(\d+):([0-5]\d)$/.exec(text);
	if (clock) total = Number(clock[1]) * 60 + Number(clock[2]);
	else {
		total = 0;
		let next = 0; // the first unit this part may name
		let bare = false; // a unitless number has been read; nothing may follow it
		PART.lastIndex = 0;
		while (PART.lastIndex < text.length) {
			const start = PART.lastIndex;
			if (text[start] === ' ') {
				PART.lastIndex++;
				continue;
			}
			const match = PART.exec(text);
			if (!match || bare) return { ok: false, reason: 'unreadable' };
			const [, number, word] = match;
			// A bare number is minutes: alone ("45") or after the hours ("1 h 30").
			const unit = word === '' ? 2 : UNITS.findIndex((u) => u.pattern.test(word));
			if (unit < next || (word === '' && next === 1)) return { ok: false, reason: 'unreadable' };
			bare = word === '';
			total += Number(number) * UNITS[unit].minutes;
			next = unit + 1;
		}
	}
	const minutes = Math.round(total);
	return minutes > MAX_DURATION_MINUTES ? { ok: false, reason: 'tooLong' } : { ok: true, minutes };
}

/** A stored time as the page shows it: "45 min", "1 h 30 min", "2 days". */
export function formatDuration(minutes: number): string {
	if (minutes >= 1440 && minutes % 1440 === 0) {
		const days = minutes / 1440;
		return days === 1 ? '1 day' : `${days} days`;
	}
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/**
 * The times a recipe states, each its own span, value then word, in
 * TIME_FIELDS order: "15 min" "prep". Never a total: prep, cook and rest can
 * overlap, and only the author could say by how much.
 */
export function timeSpans(
	times: Partial<Record<TimeField, number | null>>
): Array<{ value: string; word: string }> {
	return (Object.keys(TIME_FIELDS) as TimeField[]).flatMap((field) => {
		const minutes = times[field];
		return minutes ? [{ value: formatDuration(minutes), word: TIME_FIELDS[field].word }] : [];
	});
}
