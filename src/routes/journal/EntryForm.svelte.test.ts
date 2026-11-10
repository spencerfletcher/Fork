import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import EntryForm from './EntryForm.svelte';
import { AUDIENCE_SENTENCE, KEEP_SOURCE, MAX_LINK, PRIVATE_RECIPE_HINT } from '#lib/journal.js';
import type { EntryValues } from './entryForm';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

function makeValues(overrides: Partial<EntryValues> = {}): EntryValues {
	return {
		dish: 'Sauce',
		cookedOn: '2026-10-24',
		servings: '',
		caption: '',
		note: '',
		audience: 'private',
		recipe: 'sauce',
		version: '5',
		link: '',
		...overrides
	};
}

const CHOICES = [
	{ slug: 'sauce', title: 'Tomato Sauce', visibility: 'private' as const, latestVersion: 5 },
	{ slug: 'dal', title: 'Dal', visibility: 'public' as const, latestVersion: 2 }
];

const recipeBox = () => screen.getByRole('combobox', { name: /From a recipe/ });
const recipeField = (container: HTMLElement) =>
	container.querySelector<HTMLInputElement>('input[name="recipe"]')!;

/** Types into the recipe box, then takes the arrowed-to option with Enter. */
async function chooseRecipe(typed: string) {
	await fireEvent.input(recipeBox(), { target: { value: typed } });
	await fireEvent.keyDown(recipeBox(), { key: 'ArrowDown' });
	await fireEvent.keyDown(recipeBox(), { key: 'Enter' });
}

const renderForm = (values = makeValues()) =>
	render(EntryForm, { props: { values, choices: CHOICES, submitLabel: 'Add to Journal' } });

describe('EntryForm', () => {
	test('Only me by default, each choice with its sentence; the button reads Add to Journal', () => {
		renderForm();
		expect(screen.getByRole('radio', { name: 'Only me' })).toBeChecked();
		expect(screen.getByText(AUDIENCE_SENTENCE.private)).toBeInTheDocument();
		expect(screen.getByText(AUDIENCE_SENTENCE.friends)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Add to Journal' })).toBeInTheDocument();
		expect(screen.getByLabelText(/Dish/)).toBeRequired();
		expect(screen.getByLabelText(/Date/)).toBeRequired();
	});

	// The server refuses only a missing dish or date (src/lib/server/journal.ts).
	test('Dish and Date say Required in their labels; nothing says optional', () => {
		const { container } = renderForm(makeValues({ recipe: '', version: '' }));
		expect(screen.getByRole('textbox', { name: 'Dish' })).toBeRequired();
		const date = container.querySelector('#cookedOn');
		expect(date).toHaveAccessibleName('Date');
		expect(date).toBeRequired();
		const marked = [...container.querySelectorAll('.field-required')];
		expect(marked.map((m) => m.closest('label')?.htmlFor)).toEqual(['dish', 'cookedOn']);
		expect(container).not.toHaveTextContent(/optional|\*/i);
	});

	test('Friends on an Only me recipe says friends see the dish, not the recipe', async () => {
		renderForm();
		expect(screen.queryByText(PRIVATE_RECIPE_HINT)).toBeNull();
		await fireEvent.click(screen.getByRole('radio', { name: 'Friends' }));
		expect(screen.getByText(PRIVATE_RECIPE_HINT)).toBeInTheDocument();
	});

	test('with no recipe, an optional Link field takes a URL, prefilled, capped at MAX_LINK', async () => {
		renderForm(makeValues({ recipe: '', version: '', link: 'https://seriouseats.com/dal' }));
		const link = screen.getByLabelText(/Link/);
		expect(link).toHaveAttribute('type', 'url');
		expect(link).toHaveAttribute('name', 'link');
		expect(link).toHaveAttribute('maxlength', String(MAX_LINK));
		expect(link).not.toBeRequired();
		expect(link).toHaveValue('https://seriouseats.com/dal');

		// Choosing a recipe makes the recipe the source, so the field goes.
		await chooseRecipe('dal');
		expect(screen.queryByLabelText(/Link/)).toBeNull();
	});

	test('a withheld source is kept by the KEEP_SOURCE option, selected', async () => {
		const { container } = render(EntryForm, {
			props: {
				values: makeValues({ recipe: KEEP_SOURCE }),
				choices: CHOICES,
				submitLabel: 'Save',
				keepLabel: 'Recipe deleted'
			}
		});
		expect(recipeField(container)).toHaveValue(KEEP_SOURCE);
		expect(recipeBox()).toHaveValue('Recipe deleted');
		await fireEvent.click(recipeBox());
		expect(screen.getByRole('option', { name: 'Recipe deleted' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
	});

	test('the recipe box is a combobox: it shows the chosen title, lists title and version, and filters as you type', async () => {
		const { container } = renderForm();
		expect(recipeBox()).toHaveValue('Tomato Sauce');
		expect(recipeField(container)).toHaveValue('sauce');
		await fireEvent.click(recipeBox());
		expect(recipeBox()).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('option', { name: /Dal v2/ })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /Improvised/ })).toBeInTheDocument();
		await fireEvent.input(recipeBox(), { target: { value: 'tom' } });
		expect(screen.getAllByRole('option').map((o) => o.textContent?.trim())).toEqual([
			'Tomato Sauce v5'
		]);
	});

	test('arrows and Enter choose; Escape closes and puts the chosen title back', async () => {
		const { container } = renderForm();
		await chooseRecipe('da');
		expect(recipeField(container)).toHaveValue('dal');
		expect(recipeBox()).toHaveValue('Dal');
		expect(recipeBox()).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.input(recipeBox(), { target: { value: 'xyz' } });
		await fireEvent.keyDown(recipeBox(), { key: 'Escape' });
		expect(recipeBox()).toHaveValue('Dal');
		expect(recipeBox()).toHaveAttribute('aria-expanded', 'false');
		expect(recipeField(container)).toHaveValue('dal');
	});

	test('a click on an option chooses it', async () => {
		const { container } = renderForm();
		await fireEvent.click(recipeBox());
		await fireEvent.click(screen.getByRole('option', { name: /Improvised/ }));
		expect(recipeField(container)).toHaveValue('');
		expect(screen.getByLabelText(/Link/)).toBeInTheDocument();
	});

	test('changing the recipe drops the prefilled version, so the latest is linked', async () => {
		const { container } = renderForm();
		const version = () => container.querySelector<HTMLInputElement>('input[name="version"]')!;
		expect(version().value).toBe('5');
		await chooseRecipe('dal');
		expect(version().value).toBe('');
	});

	test('the actions row submits the entry form from outside it, and holds a page action that is not inside it', () => {
		const { container } = render(EntryForm, {
			props: {
				values: makeValues(),
				choices: CHOICES,
				submitLabel: 'Save changes',
				actions: createRawSnippet(() => ({
					render: () => '<form class="other"><button>Delete entry</button></form>'
				}))
			}
		});
		const save = screen.getByRole('button', { name: 'Save changes' });
		const form = container.querySelector<HTMLFormElement>('form.entry-form')!;
		expect(save).toHaveAttribute('form', form.id);
		expect(save.closest('form')).toBeNull();
		const row = save.closest('.form-actions')!;
		expect(row.querySelector('.other')).not.toBeNull();
		expect(container.querySelector('form form')).toBeNull();
	});
});
