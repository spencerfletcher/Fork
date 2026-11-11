import type { SubmitFunction } from '$app/forms';

/**
 * A pressed state a form flips at once and flips back if the server refuses.
 * One request at a time: a second press while one is in flight is cancelled,
 * not disabled, so keyboard focus stays. `on` follows `initial` whenever it
 * changes (a reload, another recipe). `report` gets '' on each press and
 * `failure` on a refusal
 * (the server's own sentence when the session ended); `refresh` applies a success to the page's data.
 */
export function optimisticToggle(
	initial: () => boolean,
	{
		failure,
		report,
		refresh = false
	}: { failure: string; report: (error: string) => void; refresh?: boolean }
) {
	let on = $derived(initial());
	let busy = false;

	const submit: SubmitFunction = ({ cancel }) => {
		if (busy) return cancel();
		busy = true;
		on = !on;
		report('');
		return async ({ result, update }) => {
			busy = false;
			if (result.type === 'success') {
				// In place, so the page's query (?serves=) and an open menu stay.
				if (refresh) await update({ reset: false, navigate: false });
				return;
			}
			// Flip back: nothing was saved. A lapsed session says so in the server's
			// words, which tell the reader to log in; anything else gets ours.
			on = !on;
			const lapsed =
				result.type === 'failure' && result.data?.code === 'unauthenticated'
					? result.data.error
					: undefined;
			report(typeof lapsed === 'string' ? lapsed : failure);
		};
	};

	return {
		get on() {
			return on;
		},
		submit
	};
}
