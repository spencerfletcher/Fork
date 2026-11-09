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

/** FormData from `fields` (an array appends the key once per value), with `file` as the `image` input. */
export function formOf(fields: Record<string, string | string[]> = {}, file?: File): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) {
		for (const val of Array.isArray(v) ? v : [v]) fd.append(k, val);
	}
	if (file) fd.append('image', file);
	return fd;
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
	return {
		params: opts.params ?? {},
		request: { formData: vi.fn().mockResolvedValue(formOf(opts.fields, opts.file)) },
		locals: opts.locals ?? {}
	};
}

/**
 * A load event: `path` (with any query) on localhost, the route `params`, and
 * `user` as the only local. Typed `never`, so it passes as any route's event.
 */
export function loadEvent(
	opts: { path?: string; user?: { id: string } | null; params?: Record<string, string> } = {}
): never {
	return {
		url: new URL(opts.path ?? '/', 'http://localhost'),
		params: opts.params ?? {},
		locals: { user: opts.user ?? null }
	} as never;
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
