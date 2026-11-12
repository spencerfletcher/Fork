import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import SaverNote from './SaverNote.svelte';
import { NOTE_MAX } from '#lib/saves.js';
import { cssRule } from '#lib/testing/css.js';
import source from './SaverNote.svelte?raw';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

describe('SaverNote', () => {
	test('with no note, one "Add a note" button opens an empty box, focused', async () => {
		render(SaverNote, { props: { note: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add a note' }));
		await tick();
		const box = screen.getByRole('textbox', { name: /Your note/ }) as HTMLTextAreaElement;
		expect(box.value).toBe('');
		expect(box.maxLength).toBe(NOTE_MAX);
		expect(box.name).toBe('note');
		expect(box.closest('form')?.getAttribute('action')).toBe('?/note');
		expect(document.activeElement).toBe(box);
	});

	test('a note shows as the saver’s own, and Edit note opens it in place; Cancel puts it back', async () => {
		render(SaverNote, { props: { note: 'Less salt next time' } });
		expect(screen.getByText('Less salt next time')).toBeTruthy();
		expect(screen.getByText(/Your note · only you/)).toBeTruthy();
		await fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
		const box = screen.getByRole('textbox', { name: /Your note/ }) as HTMLTextAreaElement;
		expect(box.value).toBe('Less salt next time');
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await tick();
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit note' }));
	});

	test('Escape in the box cancels', async () => {
		render(SaverNote, { props: { note: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Add a note' }));
		await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
		expect(screen.queryByRole('textbox')).toBeNull();
	});

	test('where a text button is 44px tall, Add a note rises into its margin: 24px under the line above, as Keep this version sits', () => {
		// jsdom applies no component CSS, so the rule is read from the source.
		const touch = source.slice(source.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		expect(cssRule(touch, '.saver-note > .text-btn')).toMatch(/margin-top: -10px;/);
	});
});
