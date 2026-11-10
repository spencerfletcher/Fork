import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import StepEditor from './StepEditor.svelte';

// The live box a person types in, and the textarea behind it that submits.
function box() {
	return screen.getByRole('textbox', { name: 'Method Required' });
}

function field() {
	return document.querySelector<HTMLTextAreaElement>('textarea[name="steps"]')!;
}

describe('StepEditor', () => {
	test('renders the value in a box labelled Method, over a textarea named for the form field', () => {
		render(StepEditor, { props: { value: 'Mix.\n\nBake.' } });
		expect(box()).toBeInTheDocument();
		expect(field().value).toBe('Mix.\n\nBake.');
		expect(field().name).toBe('steps');
	});

	test('explains blank-line separation and the note keywords', () => {
		render(StepEditor, { props: { value: '' } });
		const hint = screen.getByText(/blank line/i);
		expect(hint).toHaveTextContent('tip:');
		expect(hint).toHaveTextContent('warning:');
		expect(hint).toHaveTextContent('substitution:');
	});

	test('sets each keyword apart as literal syntax, in bold sans', () => {
		render(StepEditor, { props: { value: '' } });
		const hint = screen.getByText(/blank line/i);
		// Bold in the hint's sans, never mono (Spencer: "it should all be sans").
		for (const keyword of ['tip:', 'warning:', 'substitution:', '# Bake']) {
			expect(within(hint).getByText(keyword).tagName).toBe('B');
		}
	});

	test('keeps the hint while there is text in the box', async () => {
		render(StepEditor, { props: { value: '' } });
		await fireEvent.input(field(), { target: { value: 'Mix.' } });
		expect(screen.getByText(/blank line/i)).toBeInTheDocument();
	});

	test('the hint describes the box, so a screen reader hears the syntax too', () => {
		render(StepEditor, { props: { value: '' } });
		expect(box()).not.toHaveAttribute('aria-invalid');
		expect(box()).toHaveAccessibleDescription(
			/^Separate steps with a blank line\..*on its own line\. A line like # Bake starts a group\.$/
		);
	});

	test('an error sits above the hint, marks the box invalid and describes it, error first', () => {
		render(StepEditor, { props: { value: '', error: 'At least one step is required' } });
		expect(box()).toHaveAttribute('aria-invalid', 'true');
		expect(box()).toHaveAccessibleDescription(/^At least one step is required Separate steps/);
		const error = screen.getByRole('alert');
		const hint = screen.getByText(/blank line/i);
		expect(error.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test('accepts input', async () => {
		render(StepEditor, { props: { value: '' } });
		await fireEvent.input(field(), { target: { value: 'Chop.' } });
		expect(field().value).toBe('Chop.');
		expect(box()).toHaveTextContent('Chop.');
	});

	describe('groups', () => {
		test('a "# Name" line gets a read-back of the steps each group holds, numbered straight through', async () => {
			render(StepEditor, { props: { value: '' } });
			await fireEvent.input(field(), {
				target: { value: '# Make the dough\nMix.\n\nKnead.\n\n# Bake\nBake.' }
			});
			const readBack = document.getElementById('steps-readback')!;
			expect(readBack.textContent!.replace(/\s+/g, ' ').trim()).toBe(
				'Reads as 3 steps in 2 groups: Make the dough 1–2 Bake 3'
			);
			expect(box().getAttribute('aria-describedby')).toContain('steps-readback');
		});

		test('no "# Name" line, no read-back; the hint names the syntax', () => {
			render(StepEditor, { props: { value: 'Mix.' } });
			expect(document.getElementById('steps-readback')).toBeNull();
			const hint = screen.getByText(/blank line/i);
			expect(hint).toHaveTextContent('A line like # Bake starts a group.');
		});
	});
});
