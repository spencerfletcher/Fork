import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeMethod from './RecipeMethod.svelte';
import { ticksKey, loadTicks, saveTicks } from './ticks';

const KEY = ticksKey('my-fork', 3, 'steps');

describe('RecipeMethod', () => {
	test('numbers steps by position, in the display face and clay', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [{ text: 'Mix.' }, { text: 'Bake.' }] }
		});
		expect(screen.getByText('1')).toHaveClass('font-serif', 'text-accent');
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	test('is a section the tab bar can jump to, headed by an h2', () => {
		const { container } = render(RecipeMethod, {
			props: { storageKey: KEY, steps: [{ text: 'Mix.' }] }
		});
		expect(container.querySelector('section#method')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 2, name: 'Method' })).toBeInTheDocument();
	});

	test('annotations keep their own tone', () => {
		render(RecipeMethod, {
			props: {
				storageKey: KEY,
				steps: [{ text: 'Bake.', annotation: { type: 'warning', text: 'Hot.' } }]
			}
		});
		expect(screen.getByText('Hot.')).toHaveClass('text-remove');
	});

	test('keeps line breaks inside a step', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [{ text: 'Mix.\nRest 10 minutes.' }] }
		});
		const p = screen.getByText(/Rest 10 minutes/);
		expect(p.textContent).toBe('Mix.\nRest 10 minutes.');
		expect(p).toHaveClass('whitespace-pre-line');
	});

	test('the square that pictures the checkbox sits in the number column, before the numeral', () => {
		render(RecipeMethod, { props: { storageKey: KEY, steps: [{ text: 'Mix.' }] } });
		const tick = screen.getByRole('checkbox').closest('label')!.querySelector('.tick')!;
		expect(tick).toHaveAttribute('aria-hidden', 'true');
		expect(tick).toHaveClass('group-has-[:checked]:bg-accent');
		expect(screen.getByRole('checkbox')).toHaveClass('sr-only');
	});

	test('the square is drawn in Ink 3, and a ticked step dims its numeral and text, not the square', () => {
		render(RecipeMethod, { props: { storageKey: KEY, steps: [{ text: 'Mix.' }] } });
		const row = screen.getByRole('checkbox').closest('label')!;
		const tick = row.querySelector('.tick')!;
		expect(tick).toHaveClass('border-text-3');
		expect(tick).not.toHaveClass('border-border-2');
		expect(row.className).not.toContain('opacity-60');
		expect(tick.closest('.group-has-\\[\\:checked\\]\\:opacity-60')).toBeNull();
		expect(screen.getByText('1')).toHaveClass('group-has-[:checked]:opacity-60');
		expect(screen.getByText('Mix.').parentElement).toHaveClass('group-has-[:checked]:opacity-60');
	});

	test('each step is a native checkbox named by its text, toggled by clicking the row', async () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [{ text: 'Mix.' }, { text: 'Bake.' }] }
		});
		const bake = screen.getByRole('checkbox', { name: /Bake\./ });
		expect(bake).not.toBeChecked();
		await fireEvent.click(bake.closest('label')!);
		expect(bake).toBeChecked();
	});

	test('restores the ticks saved for this version, and saves each new one', async () => {
		saveTicks(KEY, [0]);
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [{ text: 'Mix.' }, { text: 'Bake.' }] }
		});
		const boxes = screen.getAllByRole('checkbox');
		await vi.waitFor(() => expect(boxes[0]).toBeChecked());
		await fireEvent.click(boxes[1]);
		expect(loadTicks(KEY)).toEqual([0, 1]);
		localStorage.clear();
	});

	test('the tick sits 18px from its numeral, the numeral 10px from the text, in a column that fits two digits', () => {
		render(RecipeMethod, { props: { storageKey: KEY, steps: [{ text: 'Mix.' }] } });
		const row = screen.getByRole('checkbox').closest('label')!;
		const numeral = screen.getByText('1');
		// The tick (14px), the 18px gap and "10" (22.7px) are 54.7px: one column
		// width for every row keeps the text's left edge level past step 9.
		expect(row).toHaveClass('gap-2.5', '[grid-template-columns:55px_1fr]');
		expect(numeral.parentElement).toHaveClass('gap-[18px]');
	});
});
