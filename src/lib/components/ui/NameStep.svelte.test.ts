import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NameStep from './NameStep.svelte';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const props = {
	id: 'shelf-name',
	label: 'New shelf',
	action: '?/makeShelf',
	enhance: () => {},
	error: null,
	pending: false,
	submitLabel: 'Make',
	onback: () => {}
};

const box = () => screen.getByRole('textbox', { name: props.label });

describe('NameStep', () => {
	test('a labelled, capped, required name box posting to the action, with a small primary submit', () => {
		const { container } = render(NameStep, { props });
		expect(box()).toHaveAttribute('id', props.id);
		expect(box()).toHaveAttribute('name', 'name');
		expect(box()).toHaveAttribute('maxlength', String(COLLECTION_NAME_MAX));
		expect(box()).toBeRequired();
		expect(box()).not.toHaveAttribute('aria-invalid');
		expect(box()).not.toHaveAttribute('aria-describedby');
		expect(container.querySelector('form')).toHaveAttribute('action', props.action);
		const submit = screen.getByRole('button', { name: props.submitLabel });
		expect(submit).toHaveAttribute('type', 'submit');
		expect(submit).toHaveClass('btn-primary', 'btn-sm');
		expect(submit).toBeEnabled();
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('a starting value, hidden fields and a label for screen readers alone', () => {
		const { container } = render(NameStep, {
			props: { ...props, value: 'Weeknight', fields: { id: '7' }, labelHidden: true }
		});
		expect(box()).toHaveValue('Weeknight');
		expect(container.querySelector('input[type="hidden"][name="id"]')).toHaveValue('7');
		expect(container.querySelector('label')).toHaveClass('sr-only');
	});

	test('a refusal marks the box invalid, describes it and is announced', () => {
		render(NameStep, { props: { ...props, error: 'Pick another name.' } });
		expect(box()).toHaveAttribute('aria-invalid', 'true');
		expect(box()).toHaveAccessibleDescription('Pick another name.');
		expect(screen.getByRole('alert')).toHaveAttribute('id', `${props.id}-error`);
	});

	test('pending disables the submit', () => {
		render(NameStep, { props: { ...props, pending: true } });
		expect(screen.getByRole('button', { name: props.submitLabel })).toBeDisabled();
	});

	test('Escape goes back and goes no further; other keys do not', async () => {
		const onback = vi.fn();
		const outer = vi.fn();
		document.addEventListener('keydown', outer);
		render(NameStep, { props: { ...props, onback } });
		await fireEvent.keyDown(box(), { key: 'a' });
		expect(onback).not.toHaveBeenCalled();
		await fireEvent.keyDown(box(), { key: 'Escape' });
		expect(onback).toHaveBeenCalledOnce();
		// Only the 'a' reached the document: Escape stopped at the box.
		expect(outer).toHaveBeenCalledOnce();
		document.removeEventListener('keydown', outer);
	});
});
