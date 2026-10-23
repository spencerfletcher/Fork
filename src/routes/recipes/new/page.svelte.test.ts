import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import NewPage from './+page.svelte';

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

const data = { allTags: [] } as never;

describe('New recipe page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('shows the returned error', () => {
		render(NewPage, { props: { data, form: { error: 'Title is required' } } });
		expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
	});
});

describe('New recipe page editor state', () => {
	test('disables the button and relabels it while the save is pending', async () => {
		render(NewPage, { props: { data, form: null } });
		const finish = (await captured.submits[0]({} as never)) as (input: unknown) => Promise<void>;
		await tick();
		expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
		await finish({ update: async () => {} });
		await tick();
		expect(screen.getByRole('button', { name: 'Create recipe' })).toBeEnabled();
	});

	test('shows unsaved changes after typing', async () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText(/title/i), { target: { value: 'Brownies' } });
		expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
	});

	test('starts with empty ingredient and step textareas in the form', () => {
		render(NewPage, { props: { data, form: null } });
		const ingredients = screen.getByLabelText('Ingredients');
		expect(ingredients).toHaveValue('');
		expect(ingredients).toHaveAttribute('name', 'ingredients');
		expect(ingredients.closest('form')).not.toBeNull();
		expect(screen.getByLabelText('Steps')).toHaveAttribute('name', 'steps');
	});
});
