import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import NewPage from './+page.svelte';
import type { Visibility } from '#lib/recipes/validation.js';

const captured = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
vi.mock('$app/navigation', () => ({ beforeNavigate: () => {} }));
vi.mock('$app/forms', () => ({
	enhance: (_node: HTMLFormElement, submit: SubmitFunction) => {
		captured.submits.push(submit);
		return { destroy: () => {} };
	}
}));

/** The header's outcome line, matched on its whole text: its version ids sit in spans of their own. */
const editingLine = (text: string) =>
	screen.getByText((_, el) => !!el?.matches('.editing') && el.textContent === text);

beforeEach(() => {
	captured.submits.length = 0;
});

const data = { allTags: [] } as never;

const EMPTY_DRAFT = {
	title: '',
	description: '',
	servings: '',
	makes: '',
	prepTimeMinutes: '',
	cookTimeMinutes: '',
	ingredients: '',
	steps: '',
	commitMessage: '',
	editRevision: '',
	visibility: 'private' as Visibility,
	tags: [] as string[],
	hadPhoto: false,
	removeImage: false
};

function failed(draft: Partial<typeof EMPTY_DRAFT>, error = 'Title is required') {
	return { error, code: 'invalid' as const, draft: { ...EMPTY_DRAFT, ...draft } };
}

describe('New recipe page labels', () => {
	test('every required field marks its label with an asterisk for the eye only: the box keeps its plain name', () => {
		render(NewPage, { props: { data, form: null } });
		for (const name of ['Title', 'Ingredients', 'Method']) {
			const box = screen.getByRole('textbox', { name });
			const mark = document.querySelector(`label[for="${box.id}"] .required`);
			expect(mark, name).toHaveTextContent('*');
			expect(mark, name).toHaveAttribute('aria-hidden', 'true');
			expect(box).toBeRequired();
		}
	});

	test('who can see the recipe is three named radios, each described by its sentence', () => {
		render(NewPage, { props: { data, form: null } });
		const group = screen.getByRole('group', { name: 'Who can see this recipe' });
		const radios = within(group).getAllByRole('radio');
		expect(radios.map((r) => [r.getAttribute('value'), r.getAttribute('name')])).toEqual([
			['private', 'visibility'],
			['friends', 'visibility'],
			['public', 'visibility']
		]);
		expect(within(group).getByRole('radio', { name: 'Only me' })).toHaveAccessibleDescription(
			'Only you can see it. You can share it later.'
		);
		expect(within(group).getByRole('radio', { name: 'Friends' })).toHaveAccessibleDescription(
			'Approved friends can see, save and fork it. It stays out of Discover.'
		);
		expect(within(group).getByRole('radio', { name: 'Public' })).toHaveAccessibleDescription(
			'Anyone can find, save and fork it.'
		);
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
		const ingredients = document.querySelector('textarea[name="ingredients"]')!;
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
				form: failed({ title: 'Soup' }, 'Could not save the recipe. Try again.')
			}
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent('Could not save the recipe');
		expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
	});

	test('passing through the untouched required fields marks none of them', async () => {
		render(NewPage, { props: { data, form: null } });
		for (const field of [
			screen.getByLabelText(/^title/i),
			screen.getByRole('textbox', { name: 'Ingredients' }),
			screen.getByRole('textbox', { name: 'Method' })
		]) {
			await fireEvent.focusIn(field);
			await fireEvent.focusOut(field);
			expect(field).not.toHaveAttribute('aria-invalid');
		}
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test("leaving an edited Title empty marks it with the server's own wording before any save, and typing clears it", async () => {
		render(NewPage, { props: { data, form: null } });
		const title = screen.getByLabelText(/^title/i);
		expect(title).not.toHaveAttribute('aria-invalid');
		await fireEvent.input(title, { target: { value: '' } });
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
		const ingredients = screen.getByRole('textbox', { name: 'Ingredients' });
		const steps = screen.getByRole('textbox', { name: 'Method' });
		expect(ingredients).toBeRequired();
		expect(steps).toBeRequired();
		for (const box of [ingredients, steps]) {
			// Typed, then emptied: the box tells the form when it is left.
			await fireEvent.input(box);
			await fireEvent.focusOut(box);
		}
		expect(ingredients).toHaveAccessibleDescription(
			/^At least one ingredient is required One per line/
		);
		expect(steps).toHaveAccessibleDescription(/^At least one step is required /);
	});

	test('refills the form from the returned draft after a failed save', async () => {
		render(NewPage, {
			props: {
				data,
				form: failed({
					title: 'Soup',
					prepTimeMinutes: '-5',
					tags: ['Dessert'],
					visibility: 'public'
				})
			}
		});
		await tick();
		expect(screen.getByLabelText(/title/i)).toHaveValue('Soup');
		expect(screen.getByLabelText(/^prep/i)).toHaveValue(-5);
		expect(screen.getByRole('radio', { name: 'Public' })).toBeChecked();
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
		// The live boxes are no form controls, so the fieldset cannot disable them.
		const method = screen.getByRole('textbox', { name: 'Method' });
		expect(method).toHaveAttribute('contenteditable', 'false');
		await finish({ result: { type: 'failure' }, update: async () => {} });
		await tick();
		expect(screen.getByRole('button', { name: 'Create recipe' })).toBeEnabled();
		expect(screen.getByLabelText(/title/i)).toBeEnabled();
		expect(method).toHaveAttribute('contenteditable', 'true');
	});

	test('the header line says the save makes v1, while typing too, and no helper sits beside Create', async () => {
		render(NewPage, { props: { data, form: null } });
		const line = editingLine('saves as v1');
		expect(line).toHaveAttribute('aria-live', 'polite');
		expect(line.closest('.editor-header')).not.toBeNull();
		expect(within(line).getByText('v1')).toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText(/title/i), { target: { value: 'Brownies' } });
		expect(line).toHaveTextContent('saves as v1');
		expect(document.querySelector('.form-actions .form-hint')).toBeNull();
	});

	test('the header line promises v1 only while no field carries an error', async () => {
		render(NewPage, { props: { data, form: null } });
		const line = editingLine('saves as v1');
		const title = screen.getByLabelText(/^title/i);
		await fireEvent.input(title, { target: { value: 'Brownies' } });
		await fireEvent.input(title, { target: { value: '' } });
		await fireEvent.focusOut(title);
		expect(title).toHaveAttribute('aria-invalid', 'true');
		expect(line).toHaveTextContent(/^$/);
		await fireEvent.input(title, { target: { value: 'Brownies' } });
		expect(line).toHaveTextContent('saves as v1');
	});

	test('a blocked Create on the empty form counts the required fields in the header line', async () => {
		render(NewPage, { props: { data, form: null } });
		const form = screen.getByLabelText(/^title/i).closest('form')!;
		const required = form.querySelectorAll(':is(input, textarea):required');
		// The browser fires invalid on each empty required field when Create is pressed.
		for (const el of required) el.dispatchEvent(new Event('invalid', { cancelable: true }));
		await tick();
		expect(screen.getByText(`${required.length} fields need attention`)).toHaveAttribute(
			'aria-live',
			'polite'
		);
	});

	test('has Cancel to the Cookbook and no commit message field', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/cookbook');
		expect(screen.queryByLabelText(/what changed/i)).toBeNull();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Recipe');
	});

	test('starts with empty ingredient and step textareas in the form', () => {
		render(NewPage, { props: { data, form: null } });
		const ingredients = document.querySelector('textarea[name="ingredients"]')!;
		expect(ingredients).toHaveValue('');
		expect(ingredients.closest('form')).not.toBeNull();
		expect(document.querySelector('textarea[name="steps"]')).toHaveValue('');
	});
});
