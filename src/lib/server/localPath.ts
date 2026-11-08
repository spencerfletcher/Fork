/**
 * A redirect target only if it is a path on this site. Browsers read "\" as
 * "/" and drop tabs and newlines, so "/\evil.com" and "/<TAB>/evil.com" act as
 * "//evil.com": those are refused outright, and the URL parser, which follows
 * the same rules, must still land on the placeholder origin.
 */
export function localPath(value: string | null): string | null {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
		return null;
	}
	// eslint-disable-next-line no-control-regex
	if (/[\x00-\x1f]/.test(value)) return null;
	return new URL(value, 'http://x').origin === 'http://x' ? value : null;
}
