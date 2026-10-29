import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IngredientEditor from './IngredientEditor.svelte';
import { MAX_FIELD, MAX_LINE } from '#lib/recipes/limits.js';

function box() {
	return screen.getByLabelText('Ingredients') as HTMLTextAreaElement;
}

async function type(text: string) {
	await fireEvent.input(box(), { target: { value: text } });
}

describe('IngredientEditor', () => {
	test('renders the value in a labelled textarea named for the form field', () => {
		render(IngredientEditor, { props: { value: '1 cup flour\n2 eggs' } });
		expect(box().value).toBe('1 cup flour\n2 eggs');
		expect(box().name).toBe('ingredients');
	});

	test('keeps an empty live region in the page when the box is empty, so later notes are announced', () => {
		render(IngredientEditor, { props: { value: '' } });
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	test('an error marks the box invalid and describes it, under its own id', () => {
		render(IngredientEditor, {
			props: { value: '', error: 'At least one ingredient is required' }
		});
		expect(box()).toHaveAttribute('aria-invalid', 'true');
		expect(box()).toHaveAttribute('aria-describedby', 'ingredients-error');
		expect(box()).toHaveAccessibleDescription('At least one ingredient is required');
	});

	test('without an error the box carries neither aria-invalid nor a description', () => {
		render(IngredientEditor, { props: { value: '' } });
		expect(box()).not.toHaveAttribute('aria-invalid');
		expect(box()).not.toHaveAttribute('aria-describedby');
	});

	test('lists only the lines that did not parse', async () => {
		render(IngredientEditor, { props: { value: '' } });
		await type('1 cup flour\nsalt to taste\njuice of half a lemon');
		const note = screen.getByRole('status');
		expect(note).toHaveTextContent('salt to taste');
		expect(note).toHaveTextContent('juice of half a lemon');
		expect(note).not.toHaveTextContent('1 cup flour');
		expect(note).toHaveTextContent(/saved as written/i);
	});

	test('clears the note once every line parses', async () => {
		render(IngredientEditor, { props: { value: 'salt to taste' } });
		expect(screen.getByRole('status')).toBeInTheDocument();
		await type('1 tsp salt');
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	test('keeps an over-long line in the box and says so instead of parsing it', async () => {
		render(IngredientEditor, { props: { value: '' } });
		const line = '1 cup ' + 'x'.repeat(MAX_LINE);
		await type(line);
		expect(box().value).toBe(line);
		expect(screen.getByRole('status')).toHaveTextContent(`${MAX_LINE} characters`);
	});

	test('keeps an over-long field in the box and says so instead of parsing it', async () => {
		render(IngredientEditor, { props: { value: '' } });
		const text = Array(Math.ceil(MAX_FIELD / 20) + 1)
			.fill('1 cup flour xxxxxxxx')
			.join('\n');
		await type(text);
		expect(box().value).toBe(text);
		expect(screen.getByRole('status')).toHaveTextContent(
			`${MAX_FIELD.toLocaleString()} characters`
		);
	});
});
