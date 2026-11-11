import { describe, test, expect, vi, afterEach } from 'vitest';
import { rememberTimeZone, TZ_COOKIE, TZ_COOKIE_MAX_AGE } from './timeZone';

/** A document whose cookie setter records each write, as a browser's would take it. */
function fakeDoc(cookie = '') {
	const writes: string[] = [];
	return {
		writes,
		get cookie() {
			return cookie;
		},
		set cookie(value: string) {
			writes.push(value);
		}
	};
}

const zone = (timeZone: string) =>
	vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
		timeZone
	} as Intl.ResolvedDateTimeFormatOptions);

afterEach(() => vi.restoreAllMocks());

describe('rememberTimeZone', () => {
	test('writes the browser’s zone when the cookie is missing: path /, Lax, a year, readable by script', () => {
		zone('America/Los_Angeles');
		const doc = fakeDoc('other=1');
		rememberTimeZone(doc);
		expect(doc.writes).toEqual([
			`${TZ_COOKIE}=${encodeURIComponent('America/Los_Angeles')}; path=/; max-age=${TZ_COOKIE_MAX_AGE}; samesite=lax`
		]);
		expect(TZ_COOKIE_MAX_AGE).toBe(365 * 24 * 60 * 60);
	});

	test('writes again when the zone has changed, and not when it has not', () => {
		zone('Europe/London');
		const moved = fakeDoc(`${TZ_COOKIE}=${encodeURIComponent('America/Los_Angeles')}`);
		rememberTimeZone(moved);
		expect(moved.writes).toHaveLength(1);
		expect(moved.writes[0]).toContain(`${TZ_COOKIE}=${encodeURIComponent('Europe/London')};`);

		const same = fakeDoc(`a=1; ${TZ_COOKIE}=${encodeURIComponent('Europe/London')}; b=2`);
		rememberTimeZone(same);
		expect(same.writes).toEqual([]);
	});
});
