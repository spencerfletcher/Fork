import { describe, test, expect, vi } from 'vitest';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { NOT_AUTHORIZED } from '#lib/server/visibility.js';
import { pendingEnhance, UNREACHABLE_MESSAGE } from './pendingEnhance.svelte.js';

type Submit = ReturnType<typeof pendingEnhance>['submit'];
type Result = {
	type: 'success' | 'failure' | 'redirect' | 'error';
	status?: number;
	error?: { message: string };
	data?: Record<string, unknown>;
};
type After = (opts: {
	result: Result;
	update: (options?: { reset?: boolean; navigate?: boolean }) => Promise<void>;
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
	// A form posting to another route's action: SvelteKit does not hand that
	// failure to this page's form, so the form holds its words itself.
	test('keepFailure: a failure is held as error, not applied; a later success clears it', async () => {
		const form = pendingEnhance({ keepFailure: true });
		const after = (await (form.submit as unknown as () => After)()) as After;
		const update = vi.fn(async () => {});
		const words = SESSION_ENDED('try again');
		await after({ result: { type: 'failure', status: 401, data: { error: words } }, update });
		expect(update).not.toHaveBeenCalled();
		expect(form.pending).toBe(false);
		expect(form.error).toBe(words);
		const again = (await (form.submit as unknown as () => After)()) as After;
		expect(form.error).toBeNull();
		await again({ result: { type: 'success' }, update });
		expect(update).toHaveBeenCalledOnce();
	});

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
		expect(run.update).toHaveBeenCalledWith(expect.objectContaining({ reset: false }));
		await run.finish();
	});

	// SvelteKit 3 lands a result on the action's URL, and a relative `?/name`
	// action has dropped the page's query (?serves=, ?version=, ?collection=).
	test('update applies the result on this page, never navigating to the action URL', async () => {
		const run = await submitWith(pendingEnhance().submit, { type: 'success' });
		expect(run.update).toHaveBeenCalledWith({ reset: undefined, navigate: false });
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

	test("keepOnError: the server's own refusal says what it said, not that it was unreachable", async () => {
		const form = pendingEnhance({ keepOnError: true });
		const after = (await (form.submit as unknown as () => After)()) as After;
		await after({
			result: { type: 'error', status: 403, error: { message: NOT_AUTHORIZED } },
			update: async () => {}
		});
		expect(form.error).toBe(NOT_AUTHORIZED);
	});

	test('keepOnError: a server failure (5xx) is held as unreachable', async () => {
		const form = pendingEnhance({ keepOnError: true });
		const after = (await (form.submit as unknown as () => After)()) as After;
		await after({
			result: { type: 'error', status: 502, error: { message: 'Bad Gateway' } },
			update: async () => {}
		});
		expect(form.error).toBe(UNREACHABLE_MESSAGE);
	});

	test("unreachable: a caller's own wording for a network failure", async () => {
		const form = pendingEnhance({ keepOnError: true, unreachable: 'Nothing was sent.' });
		const after = (await (form.submit as unknown as () => After)()) as After;
		await after({ result: { type: 'error' }, update: async () => {} });
		expect(form.error).toBe('Nothing was sent.');
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
