import { describe, test, expect, vi } from 'vitest';
import { pendingEnhance, UNREACHABLE_MESSAGE } from './pendingEnhance.svelte.js';

type Submit = ReturnType<typeof pendingEnhance>['submit'];
type Result = { type: 'success' | 'failure' | 'redirect' | 'error' };
type After = (opts: {
	result: Result;
	update: (options?: { reset?: boolean }) => Promise<void>;
}) => Promise<void>;

/** Runs the submit callback as enhance would, with the result not yet applied. */
async function submitWith(submit: Submit, result: Result = { type: 'failure' }) {
	const after = (await (submit as unknown as () => After)()) as After;
	let apply!: () => void;
	const update = vi.fn(() => new Promise<void>((resolve) => (apply = resolve)));
	const finished = after({ result, update });
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

	test('keepOnError: an error result is not applied, so the form stays; pending ends and the error is held', async () => {
		const done = vi.fn();
		const form = pendingEnhance({ keepOnError: true, done });
		const after = (await (form.submit as unknown as () => After)()) as After;
		const update = vi.fn(async () => {});
		await after({ result: { type: 'error' }, update });
		expect(update).not.toHaveBeenCalled();
		expect(form.pending).toBe(false);
		expect(form.error).toBe(UNREACHABLE_MESSAGE);
		expect(done).not.toHaveBeenCalled();
	});

	test('the held error clears on the next submit', async () => {
		const form = pendingEnhance({ keepOnError: true });
		const after = (await (form.submit as unknown as () => After)()) as After;
		await after({ result: { type: 'error' }, update: async () => {} });
		await (form.submit as unknown as () => After)();
		expect(form.error).toBeNull();
	});

	test('without keepOnError an error result is applied as before', async () => {
		const run = await submitWith(pendingEnhance().submit, { type: 'error' });
		expect(run.update).toHaveBeenCalled();
		await run.finish();
	});

	test('pending ends even when applying the result throws', async () => {
		const form = pendingEnhance();
		const after = (await (form.submit as unknown as () => After)()) as After;
		const update = vi.fn(async () => {
			throw new Error('boom');
		});
		await expect(after({ result: { type: 'failure' }, update })).rejects.toThrow('boom');
		expect(form.pending).toBe(false);
	});
});
