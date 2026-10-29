import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StepEditor from './StepEditor.svelte';

function box() {
	return screen.getByLabelText('Steps') as HTMLTextAreaElement;
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

	test('keeps the hint while there is text in the box', async () => {
		render(StepEditor, { props: { value: '' } });
		await fireEvent.input(box(), { target: { value: 'Mix.' } });
		expect(screen.getByText(/blank line/i)).toBeInTheDocument();
	});

	test('the hint describes the box, so a screen reader hears the syntax too', () => {
		render(StepEditor, { props: { value: '' } });
		expect(box()).not.toHaveAttribute('aria-invalid');
		expect(box()).toHaveAccessibleDescription(
			/^Separate steps with a blank line\..*on its own line\.$/
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
});
