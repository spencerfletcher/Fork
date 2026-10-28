import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import NewPage from './+page.svelte';

const captured = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
vi.mock('$app/navigation', () => ({ beforeNavigate: () => {} }));
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

const EMPTY_DRAFT = {
	title: '',
	description: '',
	servings: '',
	prepTimeMinutes: '',
	cookTimeMinutes: '',
	ingredients: '',
	steps: '',
	commitMessage: '',
	editRevision: '',
	isPublic: true,
	tags: [] as string[],
	hadPhoto: false,
	removeImage: false
};

function failed(draft: Partial<typeof EMPTY_DRAFT>, error = 'Title is required') {
	return { error, draft: { ...EMPTY_DRAFT, ...draft } };
}

describe('New recipe page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('shows the returned error', () => {
		render(NewPage, { props: { data, form: failed({ title: '' }) } });
		expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
	});

	test('refills the form from the returned draft after a failed save', async () => {
		render(NewPage, {
			props: {
				data,
				form: failed({ title: 'Soup', prepTimeMinutes: '-5', tags: ['Dessert'], isPublic: false })
			}
		});
		await tick();
		expect(screen.getByLabelText(/title/i)).toHaveValue('Soup');
		expect(screen.getByLabelText(/^prep/i)).toHaveValue(-5);
		expect(screen.getByLabelText(/public/i)).not.toBeChecked();
		expect(document.querySelector('input[name="tags"]')).toHaveValue('Dessert');
	});

	test('asks for the photo again only when one had been chosen and the input is now empty', async () => {
		const { unmount } = render(NewPage, { props: { data, form: failed({ hadPhoto: true }) } });
		await tick();
		expect(screen.getByText(/choose the photo again/i)).toBeInTheDocument();
		unmount();
		render(NewPage, { props: { data, form: failed({ hadPhoto: false }) } });
		await tick();
		expect(screen.queryByText(/choose the photo again/i)).not.toBeInTheDocument();
	});
});

describe('New recipe page editor state', () => {
	test('disables every field and relabels the button while the save is pending', async () => {
		render(NewPage, { props: { data, form: null } });
		const finish = (await captured.submits[0]({} as never)) as (input: unknown) => Promise<void>;
		await tick();
		expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
		expect(screen.getByLabelText(/title/i)).toBeDisabled();
		await finish({ update: async () => {} });
		await tick();
		expect(screen.getByRole('button', { name: 'Create recipe' })).toBeEnabled();
		expect(screen.getByLabelText(/title/i)).toBeEnabled();
	});

	test('shows unsaved changes only while the draft differs from the empty form', async () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText(/title/i), { target: { value: 'Brownies' } });
		expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText(/title/i), { target: { value: '' } });
		expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
	});

	test('has Cancel to the recipe list and no commit message field', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/recipes');
		expect(screen.queryByLabelText(/what changed/i)).toBeNull();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New recipe');
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
