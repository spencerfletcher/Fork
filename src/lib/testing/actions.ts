import { isRedirect, isHttpError, isActionFailure } from '@sveltejs/kit';

/**
 * Runs a SvelteKit form action in a test and returns what it produced, whether
 * returned (a `fail`) or thrown (a redirect or HTTP error). Anything else
 * thrown is a real bug and propagates, instead of surfacing as a baffling
 * assertion on `.status`.
 */
export async function invokeAction(
	action: (event: never) => unknown,
	event: unknown
): Promise<Record<string, unknown>> {
	try {
		return (await action(event as never)) as Record<string, unknown>;
	} catch (e) {
		if (isRedirect(e) || isHttpError(e) || isActionFailure(e)) {
			return e as unknown as Record<string, unknown>;
		}
		throw e;
	}
}
