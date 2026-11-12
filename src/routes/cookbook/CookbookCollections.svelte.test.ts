import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookbookCollections from './CookbookCollections.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const TO_COOK = { id: 1, name: 'To cook' };

function renderShelf() {
	return render(CookbookCollections, { props: { collection: TO_COOK } });
}

describe('Cookbook collection bar', () => {
	test('the chosen collection is a heading with Rename and Delete', () => {
		renderShelf();
		expect(screen.getByRole('heading', { level: 2, name: 'To cook' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Rename To cook' })).toHaveClass('text-btn');
		expect(screen.getByRole('button', { name: 'Delete collection' })).toHaveClass('text-btn');
		// Choosing and making collections are the picker's.
		expect(screen.queryByRole('navigation')).toBeNull();
		expect(screen.queryByRole('button', { name: 'New collection' })).toBeNull();
	});

	test('Rename edits the name in place and posts the collection’s id', async () => {
		renderShelf();
		await fireEvent.click(screen.getByRole('button', { name: 'Rename To cook' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'Collection name' });
		expect(box).toHaveValue('To cook');
		expect(box).toHaveFocus();
		const form = box.closest('form')!;
		expect(form.querySelector('input[name="id"]')).toHaveValue('1');

		await fireEvent.keyDown(box, { key: 'Escape' });
		await tick();
		expect(screen.getByRole('button', { name: 'Rename To cook' })).toHaveFocus();
	});

	test('Delete is asked twice, saying the recipes stay', async () => {
		renderShelf();
		await fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Delete To cook?' });
		expect(step).toHaveAccessibleDescription(
			'Only the collection goes; its recipes stay in your Cookbook.'
		);
		const form = within(step).getByRole('button', { name: 'Delete collection' }).closest('form')!;
		expect(form).toHaveAttribute('action', '?/deleteCollection');
		expect(form.querySelector('input[name="id"]')).toHaveValue('1');
	});
});
