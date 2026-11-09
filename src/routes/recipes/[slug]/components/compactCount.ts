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
