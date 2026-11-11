import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChoiceGroup from './ChoiceGroup.svelte';
import source from './ChoiceGroup.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

const options = [
	{ value: 'tea', label: 'Tea', note: 'Hot leaves.' },
	{ value: 'coffee', label: 'Coffee', note: 'Roasted beans.' }
];
const props = { name: 'drink', legend: 'What to drink', options, value: 'tea' };

describe('ChoiceGroup', () => {
	test('one radio per option, named by its word and described by its sentence, in a legended group', () => {
		render(ChoiceGroup, { props });
		expect(screen.getByRole('group', { name: props.legend })).toBeInTheDocument();
		for (const option of options) {
			const radio = screen.getByRole('radio', { name: option.label });
			expect(radio).toHaveAttribute('name', props.name);
			expect(radio).toHaveAccessibleDescription(option.note);
		}
		expect(screen.getByRole('radio', { name: options[0].label })).toBeChecked();
	});

	test('a press moves the choice', async () => {
		render(ChoiceGroup, { props });
		await fireEvent.click(screen.getByRole('radio', { name: options[1].label }));
		expect(screen.getByRole('radio', { name: options[1].label })).toBeChecked();
		expect(screen.getByRole('radio', { name: options[0].label })).not.toBeChecked();
	});

	test('a hint joins every radio’s description', () => {
		const hint = 'Changing it later is fine.';
		render(ChoiceGroup, { props: { ...props, hint } });
		expect(screen.getByRole('radio', { name: options[1].label })).toHaveAccessibleDescription(
			`${options[1].note} ${hint}`
		);
	});

	test('two columns are asked for by a class; the radio centres on the word, 6px from it', () => {
		const { container } = render(ChoiceGroup, { props: { ...props, columns: 2 } });
		expect(container.querySelector('.choices')).toHaveClass('two');
		// jsdom applies no component CSS, so the rules are read from the source.
		expect(cssRule(source, '.choice')).toMatch(/gap: 2px 6px/);
		expect(cssRule(source, '.choice input')).toMatch(/align-self: center/);
	});
});
