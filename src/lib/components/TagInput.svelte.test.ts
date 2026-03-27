import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagInput from './TagInput.svelte';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const allTags = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' },
	{ id: 3, name: 'Dinner', slug: 'dinner' },
];

function getInput() {
	return screen.getByRole('combobox');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TagInput', () => {
	test('renders a combobox input', () => {
		render(TagInput, { props: { allTags } });
		expect(getInput()).toBeInTheDocument();
	});

	test('shows all suggestions when focused with empty query', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		expect(screen.getByText('Dessert')).toBeInTheDocument();
		expect(screen.getByText('Baking')).toBeInTheDocument();
		expect(screen.getByText('Dinner')).toBeInTheDocument();
	});

	test('filters suggestions by query', async () => {
		render(TagInput, { props: { allTags } });
		const input = getInput();
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'des' } });
		expect(screen.getByText('Dessert')).toBeInTheDocument();
		expect(screen.queryByText('Baking')).not.toBeInTheDocument();
	});

	test('shows "Create" option for a query that does not match any existing tag', async () => {
		render(TagInput, { props: { allTags } });
		const input = getInput();
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'Vegan' } });
		expect(screen.getByText(/Create/i)).toBeInTheDocument();
	});

	test('does not show "Create" option when query exactly matches an existing tag', async () => {
		render(TagInput, { props: { allTags } });
		const input = getInput();
		await fireEvent.focus(input);
		await fireEvent.input(input, { target: { value: 'Dessert' } });
		expect(screen.queryByText(/Create/i)).not.toBeInTheDocument();
	});

	test('selecting a suggestion adds it as a pill', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		const dessertBtn = screen.getByRole('button', { name: /^Dessert$/i });
		await fireEvent.mouseDown(dessertBtn);
		// Pill should appear
		expect(screen.getAllByText('Dessert').length).toBeGreaterThanOrEqual(1);
	});

	test('selected tag is removed from suggestions', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		const dessertBtn = screen.getByRole('button', { name: /^Dessert$/i });
		await fireEvent.mouseDown(dessertBtn);
		// Re-focus to open dropdown
		await fireEvent.focus(getInput());
		// Dessert should no longer appear in the dropdown list options
		const options = screen.getAllByRole('option');
		const optionTexts = options.map(o => o.textContent ?? '');
		expect(optionTexts.some(t => t.trim() === 'Dessert')).toBe(false);
	});

	test('removing a pill deselects the tag', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		const dessertBtn = screen.getByRole('button', { name: /^Dessert$/i });
		await fireEvent.mouseDown(dessertBtn);
		// Click the × button on the pill
		const removeBtn = screen.getByRole('button', { name: /remove dessert/i });
		await fireEvent.click(removeBtn);
		// Re-focus — Dessert should be in suggestions again
		await fireEvent.focus(getInput());
		expect(screen.getByRole('button', { name: /^Dessert$/i })).toBeInTheDocument();
	});

	test('creates a hidden input for each selected tag', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		const bakingBtn = screen.getByRole('button', { name: /^Baking$/i });
		await fireEvent.mouseDown(bakingBtn);
		const hidden = container.querySelectorAll('input[type="hidden"][name="tags"]');
		expect(hidden).toHaveLength(1);
		expect(hidden[0]).toHaveValue('Baking');
	});

	test('creates a hidden input per selected tag when multiple are selected', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		// Select Dessert
		await fireEvent.focus(getInput());
		await fireEvent.mouseDown(screen.getByRole('button', { name: /^Dessert$/i }));
		// Select Baking
		await fireEvent.focus(getInput());
		await fireEvent.mouseDown(screen.getByRole('button', { name: /^Baking$/i }));
		const hidden = container.querySelectorAll('input[type="hidden"][name="tags"]');
		expect(hidden).toHaveLength(2);
	});

	test('dropdown is closed when no suggestions match and canCreate is false', async () => {
		render(TagInput, { props: { allTags: [] } });
		const input = getInput();
		await fireEvent.focus(input);
		// No tags, empty query — nothing to show
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});
});
