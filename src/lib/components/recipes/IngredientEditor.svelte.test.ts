import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IngredientEditor from './IngredientEditor.svelte';

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
});
