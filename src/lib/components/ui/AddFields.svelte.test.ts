import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import AddFields from './AddFields.svelte';

const FIELDS = [
	{ name: 'equipment', label: 'Equipment' },
	{ name: 'storage', label: 'Storage' }
] as const;

// Each field as the editor draws it: a labelled box whose id is its name.
const field = createRawSnippet((name: () => string) => ({
	render: () => `<input id="${name()}" name="${name()}" aria-label="${name()} box" />`
}));

function setup(values: Record<string, string> = {}, errors: Record<string, string> = {}) {
	const props = { fields: FIELDS, value: (name: string) => values[name] ?? '', errors, field };
	const view = render(AddFields, { props });
	const update = (next: Record<string, string>) =>
		view.rerender({ ...props, value: (name: string) => next[name] ?? '' });
	return { update };
}

const box = (name: string) => document.getElementById(name);

describe('AddFields', () => {
	test('an empty field is a text button named Add and its label, and submits empty', () => {
		setup();
		const add = screen.getByRole('button', { name: 'Add Storage' });
		expect(add).toHaveClass('text-btn');
		expect(add).toHaveAttribute('type', 'button');
		expect(box('storage')).toBeNull();
		expect(document.querySelector('input[type="hidden"][name="storage"]')).toHaveValue('');
	});

	test('a press turns the button into its field and puts the cursor in it', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Add Storage' }));
		await tick();
		expect(box('storage')).toHaveFocus();
		expect(screen.queryByRole('button', { name: 'Add Storage' })).toBeNull();
		expect(document.querySelector('input[type="hidden"][name="storage"]')).toBeNull();
		expect(screen.getByRole('button', { name: 'Add Equipment' })).toBeInTheDocument();
	});

	test('a field that holds text opens filled, with no button', () => {
		setup({ storage: 'Airtight tin' });
		expect(box('storage')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Add Storage' })).toBeNull();
	});

	test('whitespace alone is empty', () => {
		setup({ storage: '  ' });
		expect(box('storage')).toBeNull();
	});

	test('a field the server refused opens, even empty', () => {
		setup({}, { storage: 'Storage is too long' });
		expect(box('storage')).toBeInTheDocument();
	});

	test('once open it stays open when its text is cleared, so the box never leaves the cursor', async () => {
		const { update } = setup({ storage: 'Airtight tin' });
		await update({ storage: '' });
		expect(box('storage')).toBeInTheDocument();
	});

	test('text arriving later (a restored draft) opens the field', async () => {
		const { update } = setup();
		await update({ equipment: 'A 23 cm tin' });
		expect(box('equipment')).toBeInTheDocument();
		expect(box('storage')).toBeNull();
	});

	test('open fields come first in their order, then the line of buttons left', () => {
		setup({ storage: 'Airtight tin' });
		const add = screen.getByRole('button', { name: 'Add Equipment' });
		expect(
			box('storage')!.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('with every field open there is no empty button line', () => {
		setup({ storage: 'a', equipment: 'b' });
		expect(document.querySelector('.add-line')).toBeNull();
	});
});
