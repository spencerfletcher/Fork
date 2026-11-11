import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChoiceSelect from './ChoiceSelect.svelte';

const options = [
	{ value: 'private', label: 'Only me', note: 'Only you can see it.' },
	{ value: 'friends', label: 'Friends', note: 'Approved friends can see it.' },
	{ value: 'public', label: 'Public', note: 'Anyone can find it.' }
];
const props = { name: 'visibility', label: 'Who can see this recipe', options, value: 'private' };

const box = () => screen.getByRole('combobox', { name: props.label });
const submitted = () =>
	document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${props.name}"]`)!.value;
const key = (k: string) => fireEvent.keyDown(box(), { key: k });

describe('ChoiceSelect', () => {
	test('closed, it shows the chosen name with its sentence, and submits its value', () => {
		render(ChoiceSelect, { props: { ...props, value: 'friends' } });
		expect(box()).toHaveAttribute('aria-haspopup', 'listbox');
		expect(box()).toHaveAttribute('aria-expanded', 'false');
		expect(box()).toHaveTextContent(options[1].label);
		expect(box()).toHaveTextContent(options[1].note);
		expect(submitted()).toBe('friends');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	test('open, every choice shows its name and its own sentence', async () => {
		render(ChoiceSelect, { props });
		await fireEvent.click(box());
		const list = screen.getByRole('listbox', { name: props.label });
		const rows = screen.getAllByRole('option');
		expect(list).toContainElement(rows[0]);
		expect(rows).toHaveLength(options.length);
		options.forEach((o, i) => {
			expect(rows[i]).toHaveTextContent(o.label);
			expect(rows[i]).toHaveTextContent(o.note);
		});
	});

	test('the keyboard opens it on the current choice, walks it and chooses with Enter', async () => {
		render(ChoiceSelect, { props });
		box().focus();
		await key('ArrowDown');
		expect(box()).toHaveAttribute('aria-expanded', 'true');
		const active = () => document.getElementById(box().getAttribute('aria-activedescendant')!);
		expect(active()).toHaveTextContent('Only me');
		await key('ArrowDown');
		await key('ArrowDown');
		await key('ArrowDown');
		expect(active()).toHaveTextContent('Public');
		await key('Home');
		expect(active()).toHaveTextContent('Only me');
		await key('End');
		await key('Enter');
		expect(box()).toHaveAttribute('aria-expanded', 'false');
		expect(submitted()).toBe('public');
		expect(box()).toHaveFocus();
	});

	test('Escape closes without changing the choice; a first letter jumps to its choice', async () => {
		render(ChoiceSelect, { props });
		box().focus();
		await key(' ');
		await key('ArrowDown');
		await key('Escape');
		expect(box()).toHaveAttribute('aria-expanded', 'false');
		expect(submitted()).toBe('private');
		await key('p');
		await key(' ');
		expect(submitted()).toBe('public');
	});

	test('a click on a choice takes it; a press outside closes the list', async () => {
		render(ChoiceSelect, { props });
		await fireEvent.click(box());
		await fireEvent.click(screen.getByRole('option', { name: /Friends/ }));
		expect(submitted()).toBe('friends');
		expect(screen.queryByRole('listbox')).toBeNull();
		await fireEvent.click(box());
		await fireEvent.pointerDown(document.body);
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(submitted()).toBe('friends');
	});

	test('a hint and an error describe the box; the error marks it invalid', () => {
		render(ChoiceSelect, {
			props: { ...props, hint: 'Forks stay.', error: 'Choose who can see it' }
		});
		expect(box()).toHaveAttribute('aria-invalid', 'true');
		expect(box()).toHaveAccessibleDescription('Forks stay. Choose who can see it');
		expect(screen.getByRole('alert')).toHaveAttribute('id', 'visibility-error');
	});
});
