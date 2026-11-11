import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import DeleteRecipe from './DeleteRecipe.svelte';
import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
import { TRASH_DAYS } from '#lib/trash.js';
import { NOT_AUTHORIZED } from '#lib/server/visibility.js';

const captured = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
vi.mock('$app/forms', () => ({
	enhance: (_node: HTMLFormElement, submit: SubmitFunction) => {
		captured.submits.push(submit);
		return { destroy: () => {} };
	}
}));

beforeEach(() => {
	captured.submits.length = 0;
});

function renderDelete(error: string | null = null) {
	const deletion = pendingEnhance({ keepOnError: true });
	render(DeleteRecipe, { props: { title: 'Brown Butter Cookies', deletion, error } });
	return deletion;
}

const trigger = () => screen.getByRole('button', { name: 'Delete recipe' });
const confirmButton = () => screen.queryByRole('button', { name: 'Move to Trash' });
const keep = () => screen.getByRole('button', { name: 'Keep recipe' });

/** Opens the confirm step, as a press of the trigger does. */
async function open() {
	await fireEvent.click(trigger());
	await tick();
}

describe('DeleteRecipe', () => {
	test('shows only the trigger until it is pressed', () => {
		renderDelete();
		expect(trigger()).toHaveAttribute('type', 'button');
		expect(confirmButton()).toBeNull();
		expect(screen.queryByText(/restore it/)).toBeNull();
	});

	test('pressing it says the recipe goes to the Trash for TRASH_DAYS and moves focus to the step', async () => {
		renderDelete();
		await open();
		const step = screen.getByRole('group', { name: 'Move Brown Butter Cookies to Trash?' });
		expect(step).toHaveFocus();
		expect(step).toHaveAccessibleDescription(
			`Moves Brown Butter Cookies to your Trash. You can restore it for ${TRASH_DAYS} days.`
		);
		expect(confirmButton()).toHaveAttribute('type', 'submit');
		expect(confirmButton()!.closest('form')).toHaveAttribute('action', '?/deleteRecipe');
		expect(confirmButton()!.closest('form')).toHaveAttribute('method', 'POST');
	});

	test('Keep recipe closes the step and returns focus to the trigger', async () => {
		renderDelete();
		await open();
		await fireEvent.click(keep());
		await tick();
		expect(confirmButton()).toBeNull();
		expect(trigger()).toHaveFocus();
	});

	test('Escape closes the step and returns focus to the trigger', async () => {
		renderDelete();
		await open();
		await fireEvent.keyDown(keep(), { key: 'Escape' });
		await tick();
		expect(confirmButton()).toBeNull();
		expect(trigger()).toHaveFocus();
	});

	test('while the delete is pending both buttons are disabled and Escape does nothing', async () => {
		renderDelete();
		await open();
		await captured.submits[0]({} as never);
		await tick();
		const deleting = screen.getByRole('button', { name: 'Moving…' });
		expect(deleting).toBeDisabled();
		expect(keep()).toBeDisabled();
		await fireEvent.keyDown(deleting, { key: 'Escape' });
		await tick();
		expect(screen.getByRole('button', { name: 'Moving…' })).toBeInTheDocument();
	});

	test("shows the server's refusal as an alert", () => {
		renderDelete(NOT_AUTHORIZED);
		expect(screen.getByRole('alert')).toHaveTextContent(NOT_AUTHORIZED);
	});
});
