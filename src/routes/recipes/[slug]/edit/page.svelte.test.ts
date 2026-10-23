import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import EditPage from './+page.svelte';
import { parseIngredientText } from '#lib/recipes/ingredients.js';

// Capture each form's submit callback so a test can drive the pending state by hand.
const captured = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
vi.mock('$app/forms', () => ({
	enhance: (_node: HTMLFormElement, submit: SubmitFunction) => {
		captured.submits.push(submit);
		return { destroy: () => {} };
	}
}));

/** Runs the captured submit callback as SvelteKit would, returning the finish step. */
async function startSubmit(index: number) {
	const finish = (await captured.submits[index]({} as never)) as (input: unknown) => Promise<void>;
	await tick();
	return () => finish({ update: async () => {} }).then(tick);
}

function makeData() {
	return {
		recipe: {
			slug: 'cookies',
			title: 'Cookies',
			description: null,
			imageUrl: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null,
			isPublic: false,
			recipesToTags: []
		},
		latestVersion: {
			ingredients: parseIngredientText('1 cup flour\n2 eggs'),
			steps: [{ text: 'Mix.' }, { text: 'Bake.', annotation: { type: 'tip', text: 'gently' } }]
		},
		allTags: []
	} as never;
}

beforeEach(() => {
	captured.submits.length = 0;
});

describe('Edit page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('shows a metadata error under the info form only', () => {
		render(EditPage, {
			props: { data: makeData(), form: { error: 'Title is required', section: 'meta' } }
		});
		const alerts = screen.getAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Title is required');
		expect(alerts[0].closest('form')).toHaveAttribute('action', '?/saveMeta');
	});

	test('shows a content error under the version form only', () => {
		render(EditPage, {
			props: { data: makeData(), form: { error: 'Each step needs text', section: 'content' } }
		});
		const alerts = screen.getAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Each step needs text');
		expect(alerts[0].closest('form')).toHaveAttribute('action', '?/saveVersion');
	});
});

describe('Edit page editor state', () => {
	test('disables the info button and relabels it while its save is pending', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const finish = await startSubmit(0);
		const button = screen.getByRole('button', { name: 'Saving…' });
		expect(button).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Save new version' })).toBeEnabled();
		await finish();
		expect(screen.getByRole('button', { name: 'Save info' })).toBeEnabled();
	});

	test('shows unsaved changes for the info form after typing', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'Brownies' } });
		const hint = screen.getByText('Unsaved changes');
		expect(hint.closest('form')).toHaveAttribute('action', '?/saveMeta');
	});

	test('fills both textareas from the latest version', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByLabelText('Ingredients')).toHaveValue('1 cup flour\n2 eggs');
		expect(screen.getByLabelText('Steps')).toHaveValue('Mix.\n\nBake.\ntip: gently');
	});

	test('shows unsaved changes for the content form after editing the ingredients', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText('Ingredients'), {
			target: { value: '1 cup flour\n3 eggs' }
		});
		const hint = screen.getByText('Unsaved changes');
		expect(hint.closest('form')).toHaveAttribute('action', '?/saveVersion');
	});

	test('shows unsaved changes for the content form after editing the steps', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(screen.getByLabelText('Steps'), { target: { value: 'Mix well.' } });
		expect(screen.getByText('Unsaved changes').closest('form')).toHaveAttribute(
			'action',
			'?/saveVersion'
		);
	});
});
