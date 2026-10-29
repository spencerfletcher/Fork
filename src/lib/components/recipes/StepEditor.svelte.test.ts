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

	test('explains blank-line separation and the note keywords while the box is empty', () => {
		render(StepEditor, { props: { value: '' } });
		const hint = screen.getByText(/blank line/i);
		expect(hint).toHaveTextContent('tip:');
		expect(hint).toHaveTextContent('warning:');
		expect(hint).toHaveTextContent('substitution:');
	});

	test('drops the hint once something is typed and brings it back when the box empties', async () => {
		render(StepEditor, { props: { value: 'Mix.' } });
		expect(screen.queryByText(/blank line/i)).toBeNull();
		await fireEvent.input(box(), { target: { value: '' } });
		expect(screen.getByText(/blank line/i)).toBeInTheDocument();
	});

	test('an error replaces the hint, marks the box invalid and describes it', () => {
		render(StepEditor, { props: { value: '', error: 'At least one step is required' } });
		expect(box()).toHaveAttribute('aria-invalid', 'true');
		expect(box()).toHaveAccessibleDescription('At least one step is required');
		expect(screen.queryByText(/blank line/i)).toBeNull();
	});

	test('accepts input', async () => {
		render(StepEditor, { props: { value: '' } });
		await fireEvent.input(box(), { target: { value: 'Chop.' } });
		expect(box().value).toBe('Chop.');
	});
});
