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

describe('New recipe page labels', () => {
	test('the required asterisk is a mark for the eye only: Title is named Title and is required', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByRole('textbox', { name: 'Title' })).toBeRequired();
	});

	test('the public checkbox is named without the middle dot its note shows', () => {
		render(NewPage, { props: { data, form: null } });
		const box = screen.getByRole('checkbox', { name: /public/i });
		expect(box).toHaveAccessibleName('Make this recipe public applies to every version');
		expect(box.closest('label')).toHaveTextContent('·');
	});
});

describe('New recipe page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('a failed save puts the error under the field it names, marks it invalid and focuses it, with no global alert', async () => {
		render(NewPage, { props: { data, form: failed({ title: '' }) } });
		await tick();
		const title = screen.getByLabelText(/^title/i);
		expect(title).toHaveAttribute('aria-invalid', 'true');
		expect(title).toHaveAccessibleDescription('Title is required');
		expect(title).toHaveFocus();
		// Announced at the field; the global alert stays empty.
		expect(screen.getByRole('alert')).toHaveAttribute('id', 'title-error');
		expect(document.querySelector('.form-error')).toBeNull();
	});

	test('a blocked submit gets no browser bubble: the inline message speaks, and the first invalid field takes focus', async () => {
		render(NewPage, { props: { data, form: null } });
		const title = screen.getByLabelText(/^title/i);
		const ingredients = screen.getByLabelText('Ingredients');
		// The browser fires invalid on each bad field in order, cancelable.
		const events = [title, ingredients].map((el) => {
			const event = new Event('invalid', { cancelable: true });
			el.dispatchEvent(event);
			return event;
		});
		await tick();
		expect(events.map((e) => e.defaultPrevented)).toEqual([true, true]);
		expect(title).toHaveFocus();
		// Each message is announced as it appears.
		expect(screen.getAllByRole('alert').map((el) => el.textContent?.trim())).toEqual([
			'Title is required',
			'At least one ingredient is required'
		]);
	});

	test('a failure no field owns stays the global alert', async () => {
		render(NewPage, {
			props: {
				data,
				form: failed({ title: 'Soup' }, 'Could not save the recipe. Please try again.')
			}
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent('Could not save the recipe');
		expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
	});

	test("leaving Title empty marks it with the server's own wording before any save, and typing clears it", async () => {
		render(NewPage, { props: { data, form: null } });
		const title = screen.getByLabelText(/^title/i);
		expect(title).not.toHaveAttribute('aria-invalid');
		await fireEvent.focusOut(title);
		expect(title).toHaveAttribute('aria-invalid', 'true');
		expect(title).toHaveAccessibleDescription('Title is required');
		await fireEvent.input(title, { target: { value: 'Soup' } });
		expect(title).not.toHaveAttribute('aria-invalid');
		expect(title).not.toHaveAccessibleDescription();
	});

	test('ingredients and steps are required fields that report it under the box', async () => {
		render(NewPage, { props: { data, form: null } });
		const ingredients = screen.getByLabelText('Ingredients');
		const steps = screen.getByLabelText('Steps');
		expect(ingredients).toBeRequired();
		expect(steps).toBeRequired();
		await fireEvent.focusOut(ingredients);
		await fireEvent.focusOut(steps);
		expect(ingredients).toHaveAccessibleDescription('At least one ingredient is required');
		expect(steps).toHaveAccessibleDescription('At least one step is required');
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

	test('says nothing about the outcome while typing; the leave guard carries the unsaved state', async () => {
		render(NewPage, { props: { data, form: null } });
		await fireEvent.input(screen.getByLabelText(/title/i), { target: { value: 'Brownies' } });
		expect(screen.queryByText(/unsaved|saves/i)).not.toBeInTheDocument();
		expect(document.querySelector('.form-actions .form-hint')).toBeNull();
	});

	test('has Cancel to the recipe list and no commit message field', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/recipes');
		expect(screen.queryByLabelText(/what changed/i)).toBeNull();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Recipe');
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
