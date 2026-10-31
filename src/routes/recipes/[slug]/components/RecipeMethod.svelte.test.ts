import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeMethod from './RecipeMethod.svelte';
import { ticksKey, loadTicks, saveTicks } from './ticks';
import { makeStep } from '#lib/recipes/fixtures.js';

const KEY = ticksKey('my-fork', 3, 'steps');

describe('RecipeMethod', () => {
	test('numbers steps by position, in clay', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		expect(screen.getByText('1')).toHaveClass('text-accent');
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	test('is a section the tab bar can jump to, headed by an h2', () => {
		const { container } = render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.')] }
		});
		expect(container.querySelector('section#method')).not.toBeNull();
		expect(screen.getByRole('heading', { level: 2, name: 'Method' })).toBeInTheDocument();
	});

	test('annotations keep their own tone', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Bake.', { type: 'warning', text: 'Hot.' })] }
		});
		expect(screen.getByText('Hot.')).toHaveClass('text-remove');
	});

	test('keeps line breaks inside a step', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.\nRest 10 minutes.')] }
		});
		const p = screen.getByText(/Rest 10 minutes/);
		expect(p.textContent).toBe('Mix.\nRest 10 minutes.');
		expect(p).toHaveClass('whitespace-pre-line');
	});

	test('steps are a list a reader hears the count of, each row a hidden checkbox with no circle drawn', () => {
		const { container } = render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		for (const box of screen.getAllByRole('checkbox')) expect(box).toHaveClass('sr-only');
		expect(container.querySelector('.tick')).toBeNull();
	});

	test('a ticked step turns its numeral and text Ink 3 and keeps its strike', () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.', { type: 'warning', text: 'Hot.' })] }
		});
		const row = screen.getByRole('checkbox').closest('label')!;
		expect(row.outerHTML).not.toContain('opacity');
		expect(row).toHaveClass('has-[:checked]:line-through');
		for (const text of ['1', 'Mix.', 'Hot.']) {
			expect(screen.getByText(text)).toHaveClass('group-has-[:checked]:text-text-3');
		}
	});

	test('each step is a native checkbox named by its text, toggled by clicking the row', async () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		const bake = screen.getByRole('checkbox', { name: /Bake\./ });
		expect(bake).not.toBeChecked();
		await fireEvent.click(bake.closest('label')!);
		expect(bake).toBeChecked();
	});

	test('restores the ticks saved for this version, and saves each new one', async () => {
		saveTicks(KEY, [0]);
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		const boxes = screen.getAllByRole('checkbox');
		await vi.waitFor(() => expect(boxes[0]).toBeChecked());
		await fireEvent.click(boxes[1]);
		expect(loadTicks(KEY)).toEqual([0, 1]);
		localStorage.clear();
	});

	test('Clear ticks shows only once a step is ticked, and clears the list and its saved ticks', async () => {
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		expect(screen.queryByRole('button', { name: 'Clear ticks' })).toBeNull();
		await fireEvent.click(screen.getAllByRole('checkbox')[1]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }));
		for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeChecked();
		expect(loadTicks(KEY)).toEqual([]);
		expect(screen.queryByRole('button', { name: 'Clear ticks' })).toBeNull();
	});

	// A mouse click (detail 1) must not scroll the page to the first step;
	// Enter or Space (detail 0) may, so the keyboard user sees where focus went.
	test('Clear ticks hands focus to the first step: from a mouse without scrolling, from the keyboard with', async () => {
		const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
		render(RecipeMethod, {
			props: { storageKey: KEY, steps: [makeStep('Mix.'), makeStep('Bake.')] }
		});
		await fireEvent.click(screen.getAllByRole('checkbox')[1]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }), { detail: 1 });
		expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
		expect(document.activeElement).toBe(screen.getAllByRole('checkbox')[0]);

		await fireEvent.click(screen.getAllByRole('checkbox')[1]);
		await fireEvent.click(screen.getByRole('button', { name: 'Clear ticks' }), { detail: 0 });
		expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
		expect(document.activeElement).toBe(screen.getAllByRole('checkbox')[0]);
		focus.mockRestore();
	});

	test('the numeral ends a 2ch column of its own face, 16px from the text, with one digit or two', () => {
		const steps = Array.from({ length: 12 }, (_, i) => makeStep(`Step ${i + 1}.`));
		render(RecipeMethod, { props: { storageKey: KEY, steps } });
		// jsdom lays nothing out, so the gaps are pinned as the classes that make
		// them: the row sets the numeral's face so 2ch is two of its tabular
		// digits, and the numeral's box ends the column, so the gap never moves.
		for (const n of ['1', '12']) {
			const numeral = screen.getByText(n);
			expect(numeral).toHaveClass('justify-self-end', 'tabular-nums');
			expect(numeral.parentElement).toHaveClass(
				'gap-4',
				'[grid-template-columns:2ch_1fr]',
				'font-serif',
				'text-[1.125rem]'
			);
		}
	});
});
