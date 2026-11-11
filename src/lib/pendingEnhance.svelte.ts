import type { SubmitFunction } from '$app/forms';

export const UNREACHABLE_MESSAGE = "Couldn't reach the server. Your changes are still here.";

/**
 * A form's enhance callback that is `pending` from submit until the result has
 * been applied, on this page at its URL (query kept), unless the action
 * redirects. `reset: false` keeps the fields as typed; `done` runs after.
 * `keepOnError` holds an error result (a network failure or a thrown `error()`)
 * as `error` instead of applying it: applying renders the error page over the
 * form, which is not a navigation, so nothing typed survives and no guard asks.
 * `keepFailure` holds a failure's `error` too: SvelteKit hands a failure to
 * the page's `form` only when the action is the page's own, so a form posting
 * to another route (the profile's Add friend) shows the refusal itself.
 */
export function pendingEnhance({
	reset,
	done,
	keepOnError,
	keepFailure
}: { reset?: boolean; done?: () => void; keepOnError?: boolean; keepFailure?: boolean } = {}) {
	let pending = $state(false);
	let error = $state<string | null>(null);

	const submit: SubmitFunction = () => {
		pending = true;
		error = null;
		return async ({ result, update }) => {
			try {
				if (keepFailure && result.type === 'failure') {
					const message: unknown = result.data?.error;
					error = typeof message === 'string' ? message : UNREACHABLE_MESSAGE;
					return;
				}
				if (keepOnError && result.type === 'error') {
					// No status is a network failure; a 4xx is the server's own refusal.
					const refused = result.status !== undefined && result.status < 500;
					const message: unknown = result.error?.message;
					error = refused && typeof message === 'string' ? message : UNREACHABLE_MESSAGE;
					return;
				}
				// In place: SvelteKit 3 would land on the action's URL, and a relative
				// `?/name` action has dropped the page's query. Redirects still go.
				await update({ reset, navigate: false });
			} finally {
				pending = false;
			}
			done?.();
		};
	};

	return {
		get pending() {
			return pending;
		},
		get error() {
			return error;
		},
		submit
	};
}
