import { expect, type Mock } from 'vitest';

/** The URL handed to a mocked `goto`'s last call, which must be a shallow replace. */
export function lastShallowUrl(goto: Mock): URL {
	const [url, opts] = goto.mock.lastCall!;
	expect(opts).toMatchObject({ shallow: true, replace: true });
	return new URL(url);
}
