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
	{ slug: 'sauce', title: 'Tomato Sauce', visibility: 'private' as const },
	{ slug: 'dal', title: 'Dal', visibility: 'public' as const }
];

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
		await fireEvent.change(screen.getByLabelText(/From a recipe/), { target: { value: 'dal' } });
		expect(screen.queryByLabelText(/Link/)).toBeNull();
	});

	test('a withheld source is kept by the KEEP_SOURCE option, selected', () => {
		render(EntryForm, {
			props: {
				values: makeValues({ recipe: KEEP_SOURCE }),
				choices: CHOICES,
				submitLabel: 'Save',
				keepLabel: 'Recipe deleted'
			}
		});
		const keep = screen.getByRole('option', { name: 'Recipe deleted' }) as HTMLOptionElement;
		expect(keep.value).toBe(KEEP_SOURCE);
		expect(keep.selected).toBe(true);
	});

	test('changing the recipe drops the prefilled version, so the latest is linked', async () => {
		const { container } = renderForm();
		const version = () => container.querySelector<HTMLInputElement>('input[name="version"]')!;
		expect(version().value).toBe('5');
		await fireEvent.change(screen.getByLabelText(/From a recipe/), { target: { value: 'dal' } });
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
