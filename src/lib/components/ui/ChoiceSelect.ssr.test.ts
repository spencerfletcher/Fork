import { describe, test, expect } from 'vitest';
import { render } from 'svelte/server';
import ChoiceSelect from './ChoiceSelect.svelte';

const options = [
	{ value: 'private', label: 'Only me', note: 'Only you can see it.' },
	{ value: 'friends', label: 'Friends', note: 'Approved friends can see it.' }
];

// Before hydration, or without JavaScript, a native select submits the same field.
describe('ChoiceSelect, server rendered', () => {
	test('is a native select of the choices with the chosen one selected, and its sentence', () => {
		const { body } = render(ChoiceSelect, {
			props: { name: 'visibility', label: 'Who can see this recipe', options, value: 'friends' }
		});
		expect(body).toMatch(/<select[^>]*name="visibility"/);
		expect(body).toMatch(/<option value="friends"[^>]*selected/);
		expect(body).toContain(options[1].note);
		expect(body).not.toContain('role="combobox"');
	});
});
