import { vi } from 'vitest';
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

/**
 * A form-action event. `fields` become FormData (an array appends the key once
 * per value), `file` goes in as the `image` input, and `locals` is whatever the
 * action reads (user, supabase).
 */
export function formEvent(
	opts: {
		fields?: Record<string, string | string[]>;
		file?: File;
		params?: Record<string, string>;
		locals?: Record<string, unknown>;
	} = {}
) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(opts.fields ?? {})) {
		for (const val of Array.isArray(v) ? v : [v]) fd.append(k, val);
	}
	if (opts.file) fd.append('image', opts.file);
	return {
		params: opts.params ?? {},
		request: { formData: vi.fn().mockResolvedValue(fd) },
		locals: opts.locals ?? {}
	};
}

/**
 * Runs a loader and narrows its result. `PageServerLoad` admits `void` and
 * types every property as `any`; the route's generated `PageData` is precise,
 * so pass it as `T`.
 */
export async function loadPage<T>(load: (event: never) => unknown, event: unknown): Promise<T> {
	const result = await load(event as never);
	if (!result) throw new Error('load returned no data');
	return result as T;
}
