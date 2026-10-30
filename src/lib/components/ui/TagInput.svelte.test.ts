import { describe, test, expect, vi } from 'vitest';
import { tick } from 'svelte';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagInput from './TagInput.svelte';
import source from './TagInput.svelte?raw';

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

	test('while the list is open the box and the list are one object: the wrapper says so, and only then', async () => {
		render(TagInput, { props: { allTags } });
		const wrapper = getInput().parentElement!;
		expect(wrapper).toContainElement(getInput());
		expect(wrapper).not.toHaveClass('tag-combo--open');
		await fireEvent.focus(getInput());
		expect(wrapper).toContainElement(screen.getByRole('listbox'));
		expect(wrapper).toHaveClass('tag-combo--open');
		await fireEvent.keyDown(getInput(), { key: 'Escape' });
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(wrapper).not.toHaveClass('tag-combo--open');
	});

	test('opening the list scrolls it into view, nearest, after a tick', async () => {
		// jsdom has no scrollIntoView; lend one for this test only.
		const scroll = vi.fn();
		Element.prototype.scrollIntoView = scroll;
		try {
			render(TagInput, { props: { allTags } });
			await fireEvent.focus(getInput());
			await tick();
			expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
			expect(scroll.mock.contexts[0]).toBe(screen.getByRole('listbox'));
		} finally {
			// @ts-expect-error put the absence back
			delete Element.prototype.scrollIntoView;
		}
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

// jsdom applies no component CSS, so the declarations are read from the source.
const style = source.slice(source.indexOf('<style>'));

describe('TagInput tag pill remove button', () => {
	// The button is the 16px glyph box, so its focus ring stays pill-sized; the
	// hit grows outward on a ::before, so the pill keeps its size too.
	test('is a 16px box with a 24px hit on a ::before with a mouse', () => {
		expect(style).toMatch(
			/\.tag-remove\s*{[^}]*position:\s*relative[^}]*width:\s*16px[^}]*height:\s*16px/
		);
		expect(style).toMatch(
			/\.tag-remove::before\s*{[^}]*content:\s*''[^}]*position:\s*absolute[^}]*inset:\s*-4px/
		);
	});

	test('is a 44px hit on a phone or under a coarse pointer, grown the same way', () => {
		const media = style.slice(style.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		expect(media).toMatch(/^@media[^{]*{\s*\.tag-remove::before\s*{[^}]*inset:\s*-14px/);
	});

	test('removing a pill moves focus to the next pill, else the previous, else the input', async () => {
		render(TagInput, { props: { allTags, selected: ['Dessert', 'Baking', 'Dinner'] } });
		const remove = (name: string) => screen.getByRole('button', { name: `Remove ${name}` });
		await fireEvent.click(remove('Baking'));
		await tick();
		expect(remove('Dinner')).toHaveFocus();
		await fireEvent.click(remove('Dinner'));
		await tick();
		expect(remove('Dessert')).toHaveFocus();
		await fireEvent.click(remove('Dessert'));
		await tick();
		expect(getInput()).toHaveFocus();
	});
});

describe('TagInput forced colours', () => {
	test('the active option draws an outline, since its background is dropped', () => {
		const media = style.slice(style.indexOf('@media (forced-colors: active)'));
		expect(media).toMatch(
			/^@media[^{]*{\s*\.tag-option\[aria-selected='true'\]\s*{[^}]*outline:\s*2px solid/
		);
	});
});

describe('TagInput Create option', () => {
	// One 1px rule between Create and what sits above it: the last suggestion's
	// bottom border, or the box's own bottom border when there is none.
	test('draws no top border of its own under a suggestion', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.input(getInput(), { target: { value: 'd' } });
		const options = screen.getAllByRole('option');
		const create = options.at(-1)!;
		expect(create).toHaveTextContent(/Create/);
		expect(options.at(-2)).toHaveClass('border-b');
		expect(create).not.toHaveClass('border-t');
	});

	test('draws no top border of its own straight under the box', async () => {
		render(TagInput, { props: { allTags } });
		await fireEvent.focus(getInput());
		await fireEvent.input(getInput(), { target: { value: 'Vegan' } });
		const options = screen.getAllByRole('option');
		expect(options).toHaveLength(1);
		expect(options[0]).not.toHaveClass('border-t');
	});
});
