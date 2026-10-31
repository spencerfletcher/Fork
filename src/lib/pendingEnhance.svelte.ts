import type { SubmitFunction } from '$app/forms';

/**
 * A form's enhance callback that is `pending` from submit until the result has
 * been applied. `reset: false` keeps the fields as typed; `done` runs after.
 */
export function pendingEnhance({ reset, done }: { reset?: boolean; done?: () => void } = {}) {
	let pending = $state(false);

	const submit: SubmitFunction = () => {
		pending = true;
		return async ({ update }) => {
			await update({ reset });
			pending = false;
			done?.();
		};
	};

	return {
		get pending() {
			return pending;
		},
		submit
	};
}
