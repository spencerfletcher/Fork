import { describe, test, expect, vi } from 'vitest';
import { pendingEnhance } from './pendingEnhance.svelte.js';

type Submit = ReturnType<typeof pendingEnhance>['submit'];
type After = (opts: { update: (options?: { reset?: boolean }) => Promise<void> }) => Promise<void>;

/** Runs the submit callback as enhance would, with the result not yet applied. */
async function submitWith(submit: Submit) {
	const after = (await (submit as unknown as () => After)()) as After;
	let apply!: () => void;
	const update = vi.fn(() => new Promise<void>((resolve) => (apply = resolve)));
	const finished = after({ update });
	return { update, finish: async () => (apply(), finished) };
}

describe('pendingEnhance', () => {
	test('pending from submit until the result is applied, then done runs', async () => {
		const done = vi.fn();
		const form = pendingEnhance({ done });
		expect(form.pending).toBe(false);
		const run = await submitWith(form.submit);
		expect(form.pending).toBe(true);
		expect(done).not.toHaveBeenCalled();
		await run.finish();
		expect(form.pending).toBe(false);
		expect(done).toHaveBeenCalledOnce();
	});

	test('reset is passed to update: false keeps the fields as typed', async () => {
		const run = await submitWith(pendingEnhance({ reset: false }).submit);
		expect(run.update).toHaveBeenCalledWith({ reset: false });
		await run.finish();
	});
});
