import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IngredientEditor from './IngredientEditor.svelte';
import { MAX_FIELD, MAX_LINE } from '#lib/recipes/limits.js';

// The live box a person types in, and the textarea behind it that submits.
function box() {
	return screen.getByRole('textbox', { name: 'Ingredients' });
}

function field() {
	return document.querySelector<HTMLTextAreaElement>('textarea[name="ingredients"]')!;
}

// The box syncs its text to the field as an input event from it.
async function type(text: string) {
	await fireEvent.input(field(), { target: { value: text } });
}

describe('IngredientEditor', () => {
	test('renders the value in a labelled box, over a textarea named for the form field', () => {
		render(IngredientEditor, { props: { value: '1 cup flour\n2 eggs' } });
		expect([...box().children].map((line) => line.textContent)).toEqual(['1 cup flour', '2 eggs']);
		expect(field().value).toBe('1 cup flour\n2 eggs');
		expect(field().name).toBe('ingredients');
	});

	test('the placeholder shows what comes back: the fraction as it is stored, not "2 1/4"', () => {
		render(IngredientEditor, { props: { value: '' } });
		expect(box()).toHaveAttribute('aria-placeholder', '2¼ cups all-purpose flour\n2 large eggs');
		expect(field().placeholder).toBe('2¼ cups all-purpose flour\n2 large eggs');
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
		expect(box()).toHaveAttribute('aria-describedby', 'ingredients-error ingredients-hint');
		expect(box()).toHaveAccessibleDescription(/^At least one ingredient is required One per line/);
		const hint = screen.getByText(/^One per line/);
		expect(
			screen.getByRole('alert').compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('without an error or a note the box is described by the format hint alone, and no empty note is drawn', () => {
		const { container } = render(IngredientEditor, { props: { value: '' } });
		expect(box()).not.toHaveAttribute('aria-invalid');
		expect(box()).toHaveAccessibleDescription(
			'One per line: quantity, unit, ingredient — 2¼ cups flour. A line like # Dough starts a group.'
		);
		expect(container.querySelector('#ingredients-note')).toBeNull();
	});

	test('keeps the format hint while there is text in the box', async () => {
		render(IngredientEditor, { props: { value: '' } });
		await type('1 cup flour');
		expect(screen.getByText(/^One per line/)).toHaveClass('form-hint');
	});

	test('the note on lines that cannot be scaled describes the box, after the error', async () => {
		render(IngredientEditor, { props: { value: '', error: 'An ingredient line is too long' } });
		await type('1 cup flour\nsalt to taste');
		expect(box()).toHaveAttribute(
			'aria-describedby',
			'ingredients-error ingredients-note ingredients-hint'
		);
		expect(box()).toHaveAccessibleDescription(
			/^An ingredient line is too long These lines .*salt to taste One per line/
		);
	});

	test('lists only the lines that did not parse', async () => {
		const { container } = render(IngredientEditor, { props: { value: '' } });
		await type('1 cup flour\nsalt to taste\njuice of half a lemon');
		const note = container.querySelector('.form-hint')!;
		expect(note).toHaveTextContent('salt to taste');
		expect(note).toHaveTextContent('juice of half a lemon');
		expect(note).not.toHaveTextContent('1 cup flour');
		expect(note).toHaveTextContent(/saved as written/i);
	});

	test('announces only when the number of lines that cannot be scaled changes, not on every keystroke', async () => {
		const { container } = render(IngredientEditor, { props: { value: '' } });
		const status = screen.getByRole('status');
		await type('1 cup flour\nsalt');
		expect(container.querySelector('.form-hint')).not.toHaveAttribute('aria-live');
		expect(status).toHaveTextContent("1 line can't be scaled");
		const node = status.firstChild;
		await type('1 cup flour\nsalt to tas');
		// The visible note follows the typing; the announcement does not move.
		expect(container.querySelector('.form-hint')).toHaveTextContent('salt to tas');
		expect(status).toHaveTextContent(/^1 line can't be scaled\.$/);
		expect(status.firstChild).toBe(node);
		await type('1 cup flour\nsalt to taste\npepper');
		expect(status).toHaveTextContent("2 lines can't be scaled");
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
		expect(field().value).toBe(line);
		expect(screen.getByRole('status')).toHaveTextContent(`${MAX_LINE} characters`);
	});

	test('keeps an over-long field in the box and says so instead of parsing it', async () => {
		render(IngredientEditor, { props: { value: '' } });
		const text = Array(Math.ceil(MAX_FIELD / 20) + 1)
			.fill('1 cup flour xxxxxxxx')
			.join('\n');
		await type(text);
		expect(field().value).toBe(text);
		expect(screen.getByRole('status')).toHaveTextContent(
			`${MAX_FIELD.toLocaleString()} characters`
		);
	});

	describe('groups', () => {
		test('a "# Name" line gets a read-back of how the box splits, which the box names', async () => {
			render(IngredientEditor, { props: { value: '' } });
			await type('# Dough\n2 cups flour\n2 eggs\n# To finish\nsalt');
			const readBack = document.getElementById('ingredients-readback')!;
			expect(readBack.textContent!.replace(/\s+/g, ' ').trim()).toBe(
				'Reads as 2 groups: Dough 2 lines To finish 1 line'
			);
			// Group names in ink 600, the rest in the hint's voice.
			expect(readBack.querySelector('b')).toHaveTextContent('Dough');
			expect(box().getAttribute('aria-describedby')).toContain('ingredients-readback');
		});

		test('an empty heading reads "empty" before the save refuses it', () => {
			render(IngredientEditor, { props: { value: '# Dough\nflour\n# Filling\n# Icing\nsugar' } });
			expect(document.getElementById('ingredients-readback')).toHaveTextContent(/Filling\s*empty/);
		});

		test('no "# Name" line, no read-back; the hint names the syntax', () => {
			render(IngredientEditor, { props: { value: '1 cup flour' } });
			expect(document.getElementById('ingredients-readback')).toBeNull();
			const hint = document.getElementById('ingredients-hint')!;
			expect(hint).toHaveTextContent(
				'One per line: quantity, unit, ingredient — 2¼ cups flour. A line like # Dough starts a group.'
			);
			expect(hint.querySelector('code')).toHaveTextContent('# Dough');
		});

		test('a heading line is never reported as a line that cannot be scaled', () => {
			render(IngredientEditor, { props: { value: '# Dough\n2 cups flour' } });
			expect(screen.queryByText(/can't be scaled/)).toBeNull();
		});
	});
});
