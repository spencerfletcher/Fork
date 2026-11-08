import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import StepEditor from './StepEditor.svelte';

function box() {
	return screen.getByLabelText(/^steps/i) as HTMLTextAreaElement;
}

describe('StepEditor', () => {
	test('renders the value in a labelled textarea named for the form field', () => {
		render(StepEditor, { props: { value: 'Mix.\n\nBake.' } });
		expect(box().value).toBe('Mix.\n\nBake.');
		expect(box().name).toBe('steps');
	});

	test('explains blank-line separation and the note keywords', () => {
		render(StepEditor, { props: { value: '' } });
		const hint = screen.getByText(/blank line/i);
		expect(hint).toHaveTextContent('tip:');
		expect(hint).toHaveTextContent('warning:');
		expect(hint).toHaveTextContent('substitution:');
	});

	test('sets each note keyword apart as literal syntax', () => {
		render(StepEditor, { props: { value: '' } });
		const hint = screen.getByText(/blank line/i);
		for (const keyword of ['tip:', 'warning:', 'substitution:']) {
			expect(within(hint).getByText(keyword).tagName).toBe('CODE');
		}
	});

	test('keeps the hint while there is text in the box', async () => {
		render(StepEditor, { props: { value: '' } });
		await fireEvent.input(box(), { target: { value: 'Mix.' } });
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
		await fireEvent.input(box(), { target: { value: 'Chop.' } });
		expect(box().value).toBe('Chop.');
	});

	describe('groups', () => {
		test('a "# Name" line gets a read-back of the steps each group holds, numbered straight through', async () => {
			render(StepEditor, { props: { value: '' } });
			await fireEvent.input(box(), {
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
