import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ConfirmStep from './ConfirmStep.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// Delete recipe's own wording and focus are covered through DeleteRecipe; this
// pins what every use shares.
const props = {
	trigger: 'Block',
	explanation: 'They will not see your recipes.',
	confirmLabel: 'Block now',
	keepLabel: 'Cancel',
	action: '/friends?/block'
};

async function open() {
	await fireEvent.click(screen.getByRole('button', { name: props.trigger }));
	await tick();
}

describe('ConfirmStep', () => {
	test('the trigger is a red ghost by default, or the class it is given', () => {
		const { unmount } = render(ConfirmStep, { props });
		expect(screen.getByRole('button', { name: props.trigger })).toHaveClass('btn-ghost', 'danger');
		unmount();
		render(ConfirmStep, { props: { ...props, triggerClass: 'text-btn' } });
		expect(screen.getByRole('button', { name: props.trigger })).toHaveClass('text-btn');
		expect(screen.getByRole('button', { name: props.trigger })).not.toHaveClass('danger');
	});

	test('without a label the step is named by its explanation; the confirm is a red submit to the action', async () => {
		render(ConfirmStep, { props });
		await open();
		const step = screen.getByRole('group', { name: props.explanation });
		expect(step).toHaveFocus();
		const confirm = screen.getByRole('button', { name: props.confirmLabel });
		expect(confirm).toHaveAttribute('type', 'submit');
		expect(confirm).toHaveClass('btn-ghost', 'danger');
		expect(confirm.closest('form')).toHaveAttribute('action', props.action);
		expect(screen.getByRole('button', { name: props.keepLabel })).not.toHaveClass('danger');
	});

	test('opens from outside through bind:open, and a pending post shows its words and holds the step open', async () => {
		render(ConfirmStep, {
			props: { ...props, open: true, pending: true, pendingLabel: 'Blocking…' }
		});
		expect(screen.getByRole('button', { name: 'Blocking…' })).toBeDisabled();
		await fireEvent.keyDown(screen.getByRole('group'), { key: 'Escape' });
		await tick();
		expect(screen.getByRole('group')).toBeInTheDocument();
	});

	test("the step takes the trigger's place: confirm, keep, then the sentence, in that order", async () => {
		render(ConfirmStep, { props });
		await open();
		expect(screen.queryByRole('button', { name: props.trigger })).toBeNull();
		const step = screen.getByRole('group', { name: props.explanation });
		const order = [...step.querySelectorAll('button, p')].map((el) => el.textContent?.trim());
		expect(order).toEqual([props.confirmLabel, props.keepLabel, props.explanation]);
	});

	test('keep and Escape each close the step and hand focus back to the trigger', async () => {
		render(ConfirmStep, { props });
		await open();
		await fireEvent.click(screen.getByRole('button', { name: props.keepLabel }));
		await tick();
		expect(screen.queryByRole('group')).toBeNull();
		expect(screen.getByRole('button', { name: props.trigger })).toHaveFocus();
		await open();
		expect(screen.getByRole('group')).toHaveFocus();
		await fireEvent.keyDown(screen.getByRole('button', { name: props.confirmLabel }), {
			key: 'Escape'
		});
		await tick();
		expect(screen.queryByRole('group')).toBeNull();
		expect(screen.getByRole('button', { name: props.trigger })).toHaveFocus();
	});

	test('a refusal is an alert under it', () => {
		render(ConfirmStep, { props: { ...props, error: 'Could not block. Try again.' } });
		expect(screen.getByRole('alert')).toHaveTextContent('Could not block. Try again.');
	});
});
