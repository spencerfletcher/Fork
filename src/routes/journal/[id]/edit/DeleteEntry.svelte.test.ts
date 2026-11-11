import { describe, test, expect, vi } from 'vitest';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import DeleteEntry from './DeleteEntry.svelte';

// The step's enhance callback is captured so a test can play back a result.
const { submits } = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
vi.mock('$app/forms', () => ({
	enhance: (_form: HTMLFormElement, submit: SubmitFunction) => {
		submits.push(submit);
		return { destroy: () => {} };
	}
}));

describe('DeleteEntry', () => {
	test('a signed-out delete says the session ended, under the step', async () => {
		render(DeleteEntry, { props: { dish: 'Buns' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
		const words = SESSION_ENDED('delete again');
		const after = await (
			submits.at(-1) as unknown as () => Promise<
				(opts: { result: unknown; update: () => Promise<void> }) => Promise<void>
			>
		)();
		const update = vi.fn(async () => {});
		await after({ result: { type: 'failure', status: 401, data: { error: words } }, update });
		await tick();
		expect(update).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent(words);
	});
});
