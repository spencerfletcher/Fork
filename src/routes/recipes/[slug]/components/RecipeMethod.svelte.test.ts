import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeMethod from './RecipeMethod.svelte';
import { makeStep } from '#lib/recipes/fixtures.js';

describe('RecipeMethod', () => {
	test('numbers steps by position, in the display face and clay', () => {
		render(RecipeMethod, { props: { steps: [makeStep('Mix.'), makeStep('Bake.')] } });
		expect(screen.getByText('1')).toHaveClass('font-serif', 'text-accent');
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	test('is a section the tab bar can jump to, headed by an h2', () => {
		const { container } = render(RecipeMethod, { props: { steps: [makeStep('Mix.')] } });
		expect(container.querySelector('section#method')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 2, name: 'Method' })).toBeInTheDocument();
	});

	test('annotations keep their own tone', () => {
		render(RecipeMethod, {
			props: { steps: [makeStep('Bake.', { type: 'warning', text: 'Hot.' })] }
		});
		expect(screen.getByText('Hot.')).toHaveClass('text-remove');
	});

	test('keeps line breaks inside a step', () => {
		render(RecipeMethod, { props: { steps: [makeStep('Mix.\nRest 10 minutes.')] } });
		const p = screen.getByText(/Rest 10 minutes/);
		expect(p.textContent).toBe('Mix.\nRest 10 minutes.');
		expect(p).toHaveClass('whitespace-pre-line');
	});

	test('steps are a list a reader hears the count of, with nothing to tick and no Clear ticks', () => {
		const { container } = render(RecipeMethod, {
			props: { steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		expect(screen.queryByRole('checkbox')).toBeNull();
		expect(screen.queryByRole('button', { name: 'Clear ticks' })).toBeNull();
		expect(container.querySelector('.tick, label')).toBeNull();
	});

	test('the numeral sits at the end of its 55px column, 10px from the text, with one digit or two', () => {
		const steps = Array.from({ length: 12 }, (_, i) => makeStep(`Step ${i + 1}.`));
		render(RecipeMethod, { props: { steps } });
		// jsdom lays nothing out, so the gaps are pinned as the classes that make
		// them: a 55px column, the 10px grid gap, and the numeral's box pushed to
		// the column's end, so the gap to the text never depends on its width.
		for (const n of ['1', '12']) {
			const numeral = screen.getByText(n);
			expect(numeral).toHaveClass('justify-self-end');
			expect(numeral.parentElement).toHaveClass('gap-2.5', '[grid-template-columns:55px_1fr]');
		}
	});
});
