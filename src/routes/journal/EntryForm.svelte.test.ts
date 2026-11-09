import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EntryForm from './EntryForm.svelte';
import { AUDIENCE_SENTENCE, PRIVATE_RECIPE_HINT } from '#lib/journal.js';
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

	test('changing the recipe drops the prefilled version, so the latest is linked', async () => {
		const { container } = renderForm();
		const version = () => container.querySelector<HTMLInputElement>('input[name="version"]')!;
		expect(version().value).toBe('5');
		await fireEvent.change(screen.getByLabelText(/From a recipe/), { target: { value: 'dal' } });
		expect(version().value).toBe('');
	});
});
