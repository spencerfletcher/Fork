import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import FormActions from './FormActions.svelte';
import source from './FormActions.svelte?raw';

const props = { submitLabel: 'Save changes', cancelHref: '/journal', form: 'entry-form' };

describe('FormActions', () => {
	test('Save submits the named form; Cancel is a ghost link with the same box', () => {
		render(FormActions, { props });
		const save = screen.getByRole('button', { name: props.submitLabel });
		expect(save).toHaveAttribute('type', 'submit');
		expect(save).toHaveAttribute('form', props.form);
		expect(save).toHaveClass('btn-primary');
		const cancel = screen.getByRole('link', { name: 'Cancel' });
		expect(cancel).toHaveAttribute('href', props.cancelHref);
		expect(cancel).toHaveClass('btn-ghost');
	});

	test('while saving, Save is disabled and says so', () => {
		render(FormActions, { props: { ...props, pending: true } });
		expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
	});

	test('a danger control sits last in the row, pinned right; on a phone on its own line', () => {
		const danger = createRawSnippet(() => ({
			render: () => '<button type="button">Delete entry</button>'
		}));
		render(FormActions, { props: { ...props, danger } });
		const row = screen.getByRole('button', { name: props.submitLabel }).parentElement!;
		const slot = screen.getByRole('button', { name: 'Delete entry' }).parentElement!;
		expect(row.lastElementChild).toBe(slot);
		// jsdom applies no component CSS, so the rules are read from the source.
		expect(source).toMatch(/\.danger \{[^}]*margin-left: auto/);
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		expect(phone).toMatch(/\.danger \{[^}]*flex-basis: 100%[^}]*align-items: flex-end/);
	});

	test('no danger, no slot', () => {
		render(FormActions, { props });
		expect(document.querySelector('.danger')).toBeNull();
	});
});
