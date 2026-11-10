import { describe, test, expect, vi } from 'vitest';
import { optimisticToggle } from './optimisticToggle.svelte.js';
import { SESSION_ENDED, type FailureCode } from '#lib/server/actions.js';

type Submit = ReturnType<typeof optimisticToggle>['submit'];
type Result = {
	type: 'success' | 'failure' | 'redirect' | 'error';
	data?: { error: string; code: FailureCode };
};
type After = (opts: {
	result: Result;
	update: (options?: { reset?: boolean }) => Promise<void>;
}) => Promise<void>;

const FAILURE = 'Could not save that. Try again.';

/** Runs the submit callback as enhance would; `settle` delivers the result. */
function press(submit: Submit) {
	const cancel = vi.fn();
	const after = (submit as unknown as (input: { cancel: () => void }) => After | undefined)({
		cancel
	});
	const update = vi.fn(async () => {});
	return { cancel, update, settle: (result: Result) => after?.({ result, update }) };
}

function makeToggle(initial = false, refresh = false) {
	const report = vi.fn();
	return { report, toggle: optimisticToggle(() => initial, { failure: FAILURE, report, refresh }) };
}

describe('optimisticToggle', () => {
	test('flips at once and clears the error; a success keeps it', async () => {
		const { toggle, report } = makeToggle();
		const run = press(toggle.submit);
		expect(toggle.on).toBe(true);
		expect(report).toHaveBeenLastCalledWith('');
		await run.settle({ type: 'success' });
		expect(toggle.on).toBe(true);
		expect(run.update).not.toHaveBeenCalled();
	});

	test('a refusal flips it back and reports the failure', async () => {
		const { toggle, report } = makeToggle(true);
		const run = press(toggle.submit);
		expect(toggle.on).toBe(false);
		await run.settle({ type: 'failure' });
		expect(toggle.on).toBe(true);
		expect(report).toHaveBeenLastCalledWith(FAILURE);
	});

	test("a lapsed session reports the server's sentence, so the reader knows to log in", async () => {
		const { toggle, report } = makeToggle();
		const run = press(toggle.submit);
		const error = SESSION_ENDED('try again');
		await run.settle({ type: 'failure', data: { error, code: 'unauthenticated' } });
		expect(toggle.on).toBe(false);
		expect(report).toHaveBeenLastCalledWith(error);
	});

	test("any other refusal keeps the toggle's own sentence", async () => {
		const { toggle, report } = makeToggle();
		const run = press(toggle.submit);
		await run.settle({ type: 'failure', data: { error: 'Entry not found', code: 'not_found' } });
		expect(report).toHaveBeenLastCalledWith(FAILURE);
	});

	test('a second press while one is in flight is cancelled, not flipped', async () => {
		const { toggle } = makeToggle();
		const first = press(toggle.submit);
		const second = press(toggle.submit);
		expect(second.cancel).toHaveBeenCalledOnce();
		expect(toggle.on).toBe(true);
		await first.settle({ type: 'success' });
		expect(press(toggle.submit).cancel).not.toHaveBeenCalled();
	});

	test('refresh applies a success without resetting the form', async () => {
		const { toggle } = makeToggle(false, true);
		const run = press(toggle.submit);
		await run.settle({ type: 'success' });
		expect(run.update).toHaveBeenCalledWith({ reset: false });
	});
});
