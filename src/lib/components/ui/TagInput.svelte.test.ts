import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagInput from './TagInput.svelte';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const allTags = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' },
	{ id: 3, name: 'Dinner', slug: 'dinner' }
];

function getInput() {
	return screen.getByRole('combobox');
}

function option(name: RegExp) {
	return screen.getByRole('option', { name });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TagInput', () => {
	test('renders a combobox input with an accessible name', () => {
		render(TagInput, { props: { allTags } });
		expect(screen.getByRole('combobox', { name: /tag/i })).toBeInTheDocument();
	});

	test('each option is the element that carries aria-selected and is not a Tab stop', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		const options = screen.getAllByRole('option');
		expect(options).toHaveLength(3);
		for (const o of options) {
			expect(o).toHaveAttribute('tabindex', '-1');
			expect(o).toHaveAttribute('aria-selected', 'false');
			expect(o.querySelector('button')).toBeNull();
		}
		expect(screen.queryByRole('button', { name: /^Dessert$/ })).toBeNull();
	});

	test('ArrowDown moves the active option, named by aria-activedescendant, and Enter picks it', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		const input = getInput();
		await fireEvent.focus(input);
		expect(input).not.toHaveAttribute('aria-activedescendant');
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(input).toHaveAttribute('aria-activedescendant', option(/^Dessert$/).id);
		expect(option(/^Dessert$/)).toHaveAttribute('aria-selected', 'true');
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(input).toHaveAttribute('aria-activedescendant', option(/^Baking$/).id);
		expect(option(/^Dessert$/)).toHaveAttribute('aria-selected', 'false');
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(container.querySelector('input[type="hidden"][name="tags"]')).toHaveValue('Baking');
		expect(input).not.toHaveAttribute('aria-activedescendant');
	});

	test('ArrowUp from the top wraps to the last option, and the Create option is reachable', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		const input = getInput();
		await fireEvent.focus(input);
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(input).toHaveAttribute('aria-activedescendant', option(/^Dinner$/).id);
		await fireEvent.input(input, { target: { value: 'Vegan' } });
		expect(input).not.toHaveAttribute('aria-activedescendant');
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(option(/Create/)).toHaveAttribute('aria-selected', 'true');
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(container.querySelector('input[type="hidden"][name="tags"]')).toHaveValue('Vegan');
	});

	test('Escape closes the list and keeps focus in the box, where an arrow opens it again', async () => {
		render(TagInput, { props: { allTags } });
		const input = getInput();
		input.focus();
		await fireEvent.focus(input);
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(input).toHaveFocus();
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(screen.getByRole('listbox')).toBeInTheDocument();
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
		expect(screen.getByRole('option').textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Create “Vegan”'
		);
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
		await fireEvent.click(option(/^Dessert$/i));
		// Pill should appear
		expect(screen.getAllByText('Dessert').length).toBeGreaterThanOrEqual(1);
	});

	test('selected tag is removed from suggestions', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.click(option(/^Dessert$/i));
		// Re-focus to open dropdown
		await fireEvent.focus(getInput());
		// Dessert should no longer appear in the dropdown list options
		const options = screen.getAllByRole('option');
		const optionTexts = options.map((o) => o.textContent ?? '');
		expect(optionTexts.some((t) => t.trim() === 'Dessert')).toBe(false);
	});

	test('removing a pill deselects the tag', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.click(option(/^Dessert$/i));
		// Click the × button on the pill
		const removeBtn = screen.getByRole('button', { name: /remove dessert/i });
		await fireEvent.click(removeBtn);
		// Re-focus — Dessert should be in suggestions again
		await fireEvent.focus(getInput());
		expect(option(/^Dessert$/i)).toBeInTheDocument();
	});

	test('creates a hidden input for each selected tag', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.click(option(/^Baking$/i));
		const hidden = container.querySelectorAll('input[type="hidden"][name="tags"]');
		expect(hidden).toHaveLength(1);
		expect(hidden[0]).toHaveValue('Baking');
	});

	test('creates a hidden input per selected tag when multiple are selected', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		// Select Dessert
		await fireEvent.focus(getInput());
		await fireEvent.click(option(/^Dessert$/i));
		// Select Baking
		await fireEvent.focus(getInput());
		await fireEvent.click(option(/^Baking$/i));
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

	test('Enter picks the first matching suggestion, keyboard only', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.input(getInput(), { target: { value: 'des' } });
		await fireEvent.keyDown(getInput(), { key: 'Enter' });
		const hidden = container.querySelectorAll('input[type="hidden"][name="tags"]');
		expect(hidden).toHaveLength(1);
		expect(hidden[0]).toHaveValue('Dessert');
	});

	test('Enter creates the typed tag when nothing matches', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.input(getInput(), { target: { value: 'Vegan' } });
		await fireEvent.keyDown(getInput(), { key: 'Enter' });
		expect(container.querySelector('input[type="hidden"][name="tags"]')).toHaveValue('Vegan');
	});

	test('a created tag cannot be added again in a different case', async () => {
		const { container } = render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.input(getInput(), { target: { value: 'Vegan' } });
		await fireEvent.keyDown(getInput(), { key: 'Enter' });
		await fireEvent.input(getInput(), { target: { value: 'vegan' } });
		expect(screen.queryByText(/Create/i)).not.toBeInTheDocument();
		await fireEvent.keyDown(getInput(), { key: 'Enter' });
		expect(container.querySelectorAll('input[type="hidden"][name="tags"]')).toHaveLength(1);
	});
});
