import type { Cookies } from '@sveltejs/kit';
import { TZ_COOKIE } from '#lib/timeZone.js';

/** Longer than any IANA zone name; the cookie is client input. */
export const MAX_ZONE_LENGTH = 64;

/** `now`'s calendar day in `timeZone` as YYYY-MM-DD; throws a RangeError for an unknown zone. */
function dayIn(timeZone: string, now: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(now);
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
	return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * The cook's calendar day as YYYY-MM-DD, by the zone their browser wrote into
 * the `tz` cookie (rememberTimeZone); UTC when it is absent, overlong or no
 * zone Intl knows.
 */
export function todayFor(cookies: Pick<Cookies, 'get'>, now: Date = new Date()): string {
	const zone = cookies.get(TZ_COOKIE);
	if (zone && zone.length <= MAX_ZONE_LENGTH) {
		try {
			return dayIn(zone, now);
		} catch {
			// Not a zone: fall through to UTC.
		}
	}
	return dayIn('UTC', now);
}
