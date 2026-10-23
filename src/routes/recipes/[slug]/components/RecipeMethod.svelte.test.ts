import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeMethod from './RecipeMethod.svelte';

describe('RecipeMethod', () => {
	test('numbers steps by position', () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.' }, { text: 'Bake.' }] } });
		expect(screen.getByText('01')).toBeInTheDocument();
		expect(screen.getByText('02')).toBeInTheDocument();
	});

	test('keeps line breaks inside a step', () => {
		render(RecipeMethod, { props: { steps: [{ text: 'Mix.\nRest 10 minutes.' }] } });
		const p = screen.getByText(/Rest 10 minutes/);
		expect(p.textContent).toBe('Mix.\nRest 10 minutes.');
		expect(p).toHaveClass('whitespace-pre-line');
	});
});
