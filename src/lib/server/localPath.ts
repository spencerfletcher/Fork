/** A redirect target only if it is a path on this site: no scheme, no host, no protocol-relative "//". */
export function localPath(value: string | null): string | null {
	return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}
