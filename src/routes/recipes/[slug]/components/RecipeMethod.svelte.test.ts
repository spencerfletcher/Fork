import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeMethod from './RecipeMethod.svelte';

describe('RecipeMethod', () => {
	test('numbers steps by position, in the display face and clay', () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.' }, { text: 'Bake.' }] } });
		expect(screen.getByText('1')).toHaveClass('font-serif', 'text-accent');
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	test('step text wraps at a reading measure while the numbers span the column', () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.' }] } });
		expect(screen.getByText('Mix.')).toHaveClass('max-w-[68ch]');
	});

	test('is a section the tab bar can jump to, headed by an h2', () => {
		const { container } = render(RecipeMethod, { props: { steps: [{ text: 'Mix.' }] } });
		expect(container.querySelector('section#method')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 2, name: 'Method' })).toBeInTheDocument();
	});

	test('annotations keep their own tone', () => {
		render(RecipeMethod, {
			props: { steps: [{ text: 'Bake.', annotation: { type: 'warning', text: 'Hot.' } }] }
		});
		expect(screen.getByText('Hot.')).toHaveClass('text-remove');
	});

	test('keeps line breaks inside a step', () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.\nRest 10 minutes.' }] } });
		const p = screen.getByText(/Rest 10 minutes/);
		expect(p.textContent).toBe('Mix.\nRest 10 minutes.');
		expect(p).toHaveClass('whitespace-pre-line');
	});

	test('each step is a native checkbox named by its text, toggled by clicking the row', async () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.' }, { text: 'Bake.' }] } });
		const bake = screen.getByRole('checkbox', { name: /Bake\./ });
		expect(bake).not.toBeChecked();
		await fireEvent.click(bake.closest('label')!);
		expect(bake).toBeChecked();
	});
});
