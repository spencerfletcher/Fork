// The cook's time zone, kept in a cookie the browser writes, so the server can
// tell which calendar day it is for them. Nothing stores it.

export const TZ_COOKIE = 'tz';

/** A year, in seconds: the cookie outlives a visit and is rewritten when the zone moves. */
export const TZ_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Writes the browser's IANA zone into the `tz` cookie when it is missing or has changed. */
export function rememberTimeZone(doc: { cookie: string } = document): void {
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const value = encodeURIComponent(zone);
	const current = doc.cookie
		.split('; ')
		.find((c) => c.startsWith(`${TZ_COOKIE}=`))
		?.slice(TZ_COOKIE.length + 1);
	if (!zone || current === value) return;
	// Not httpOnly: this script writes it. It names a zone, nothing secret.
	doc.cookie = `${TZ_COOKIE}=${value}; path=/; max-age=${TZ_COOKIE_MAX_AGE}; samesite=lax`;
}
