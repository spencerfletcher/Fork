import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ScalePanel, { TYPING_PAUSE_MS } from './ScalePanel.svelte';
import {
	MAX_SCALE,
	SCALE_HINT,
	SCALE_MESSAGES,
	formatServes,
	scaling
} from '#lib/recipes/scale.js';
import { makeContent } from '#lib/recipes/fixtures.js';
import source from './ScalePanel.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

const STORED = 3;

/** The panel as Details renders it: Details owns the count and hands it back. */
function renderPanel(count = STORED, content = makeContent({ servings: STORED })) {
	const onchange = vi.fn();
	const onclose = vi.fn();
	const view = render(ScalePanel, {
		props: { scale: scaling(content, count)!, onchange, onclose }
	});
	const rerender = (next: number) =>
		view.rerender({ scale: scaling(content, next)!, onchange, onclose });
	return { ...view, onchange, onclose, rerender };
}

const field = (name = 'Servings') => screen.getByRole<HTMLInputElement>('textbox', { name });
const button = (name: string) => screen.getByRole('button', { name });
const type = (value: string, name?: string) => fireEvent.input(field(name), { target: { value } });

describe('ScalePanel', () => {
	test('a bordered text field holding the count, its hint tied to it, and no visible label', () => {
		renderPanel();
		expect(field()).toHaveValue(String(STORED));
		expect(field()).toHaveAttribute('type', 'text');
		expect(field()).toHaveAttribute('inputmode', 'decimal');
		expect(screen.getByText(SCALE_HINT)).toHaveAttribute('id', 'scale-hint');
		expect(field()).toHaveAttribute('aria-describedby', 'scale-hint');
		// The facts line above says Serves; the panel names it for readers only.
		expect(screen.queryByText(/^Serv/)).toBeNull();
	});

	test('one row: −, the field, + as one group, then ½×, 2× and Reset, in that order', () => {
		const { container } = renderPanel();
		const row = container.querySelector('.scale-row')!;
		const names = [...row.querySelectorAll('button, input')].map(
			(el) => el.getAttribute('aria-label') ?? el.textContent!.trim()
		);
		expect(names).toEqual([
			'Fewer servings',
			'Servings',
			'More servings',
			'½× (halve)',
			'2× (double)',
			'Reset'
		]);
		const group = row.querySelector('.scale-group')!;
		expect(group).toContainElement(field());
		expect(group).toContainElement(button('Fewer servings'));
		expect(group).toContainElement(button('More servings'));
		// Label in name: each spoken name starts with the glyphs on the button.
		expect(button('½× (halve)')).toHaveTextContent('½×');
		expect(button('2× (double)')).toHaveTextContent('2×');
	});

	test.each([
		['2x', STORED * 2],
		['1/2x', STORED / 2],
		['50%', STORED / 2],
		['7', 7],
		['1/2', 0.5]
	])('typing %j applies at once, with no blur', async (typed, count) => {
		const { onchange } = renderPanel();
		await type(typed);
		expect(onchange).toHaveBeenLastCalledWith(Number(formatServes(count)));
		// What was typed stays while typing.
		expect(field()).toHaveValue(typed);
	});

	test('leaving the field writes the count it read', async () => {
		const { onchange, rerender } = renderPanel();
		await type('2x');
		await rerender(onchange.mock.lastCall![0]);
		await fireEvent.blur(field());
		expect(field()).toHaveValue(String(STORED * 2));
	});

	test('Enter writes the amount it read, never the multiplier typed', async () => {
		const { onchange, rerender } = renderPanel();
		await type('1/2x');
		await rerender(onchange.mock.lastCall![0]);
		await fireEvent.keyDown(field(), { key: 'Enter' });
		// The facts line's formatting, so the two always agree.
		expect(field()).toHaveValue(formatServes(STORED / 2));
	});

	test.each([
		// From the typed 2x, so each acts on twice STORED.
		['½× (halve)', STORED],
		['2× (double)', STORED * 4],
		['More servings', STORED * 2 + 1]
	])('after typing, %s writes the amount, not what was typed', async (name, count) => {
		const { onchange, rerender } = renderPanel();
		await type('2x');
		await rerender(onchange.mock.lastCall![0]);
		await fireEvent.click(button(name));
		await rerender(onchange.mock.lastCall![0]);
		expect(field()).toHaveValue(formatServes(count));
	});

	test('reopened while scaled, the field holds the amount', () => {
		renderPanel(STORED / 2);
		expect(field()).toHaveValue(formatServes(STORED / 2));
	});

	describe('an entry that cannot be read', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		test('keeps the last good scale and says nothing mid-way, then refuses after a pause', async () => {
			const { onchange } = renderPanel();
			await type('1/');
			expect(onchange).not.toHaveBeenCalled();
			expect(screen.queryByRole('alert')).toBeNull();
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS);
			expect(screen.getByRole('alert')).toHaveTextContent(SCALE_MESSAGES.unreadable);
			expect(field()).toHaveAttribute('aria-describedby', 'scale-error');
			expect(field()).toHaveAttribute('aria-invalid', 'true');
			// It replaces the hint, which says the same.
			expect(screen.queryByText(SCALE_HINT)).toBeNull();
			// A readable entry clears it at once.
			await type('1/2x');
			expect(screen.queryByRole('alert')).toBeNull();
			expect(onchange).toHaveBeenLastCalledWith(STORED / 2);
		});

		test('a keystroke before the pause ends puts the refusal off', async () => {
			renderPanel();
			await type('1/');
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS - 1);
			await type('1/x');
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS - 1);
			expect(screen.queryByRole('alert')).toBeNull();
		});

		test('leaving the field refuses at once, and the entry stays to be fixed', async () => {
			renderPanel();
			await type('lots');
			await fireEvent.blur(field());
			expect(screen.getByRole('alert')).toHaveTextContent(SCALE_MESSAGES.unreadable);
			expect(field()).toHaveValue('lots');
		});

		test('an emptied field waits for Enter or blur, not a pause', async () => {
			renderPanel();
			await type('');
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS * 2);
			expect(screen.queryByRole('alert')).toBeNull();
			await fireEvent.keyDown(field(), { key: 'Enter' });
			expect(screen.getByRole('alert')).toHaveTextContent(SCALE_MESSAGES.unreadable);
		});

		test.each([
			['0', 'zero'],
			['-2', 'negative'],
			[String(STORED * MAX_SCALE + 1), 'outOfRange']
		] as const)('%j is refused in the words of SCALE_MESSAGES.%s', async (typed, reason) => {
			const { onchange } = renderPanel();
			await type(typed);
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS);
			expect(onchange).not.toHaveBeenCalled();
			expect(screen.getByRole('alert')).toHaveTextContent(SCALE_MESSAGES[reason]);
		});
	});

	test('the hint and the unreadable refusal say the same examples', () => {
		expect(SCALE_MESSAGES.unreadable.toLowerCase()).toContain(SCALE_HINT.toLowerCase());
	});

	test('− and + step one serving; ArrowUp and ArrowDown in the field do the same', async () => {
		const { onchange } = renderPanel();
		await fireEvent.click(button('More servings'));
		expect(onchange).toHaveBeenLastCalledWith(STORED + 1);
		await fireEvent.click(button('Fewer servings'));
		expect(onchange).toHaveBeenLastCalledWith(STORED - 1);
		await fireEvent.keyDown(field(), { key: 'ArrowUp' });
		expect(onchange).toHaveBeenLastCalledWith(STORED + 1);
		await fireEvent.keyDown(field(), { key: 'ArrowDown' });
		expect(onchange).toHaveBeenLastCalledWith(STORED - 1);
	});

	test('a step writes the new count into the field', async () => {
		const { rerender } = renderPanel();
		await type('lots');
		await rerender(STORED + 1);
		expect(field()).toHaveValue(String(STORED + 1));
	});

	test('− is off where one less would be no servings at all', () => {
		renderPanel(1);
		expect(button('Fewer servings')).toBeDisabled();
		expect(button('More servings')).toBeEnabled();
	});

	test('½× and 2× act on the current amount, so each undoes the other', async () => {
		const { onchange, rerender } = renderPanel(STORED);
		await fireEvent.click(button('2× (double)'));
		expect(onchange).toHaveBeenLastCalledWith(STORED * 2);
		await rerender(STORED * 2);
		await fireEvent.click(button('½× (halve)'));
		expect(onchange).toHaveBeenLastCalledWith(STORED);
		await rerender(STORED);
		await fireEvent.click(button('½× (halve)'));
		expect(onchange).toHaveBeenLastCalledWith(STORED / 2);
		await rerender(STORED / 2);
		await fireEvent.click(button('2× (double)'));
		expect(onchange).toHaveBeenLastCalledWith(STORED);
	});

	test('2× is off past MAX_SCALE', () => {
		renderPanel(STORED * MAX_SCALE);
		expect(button('2× (double)')).toBeDisabled();
		expect(button('More servings')).toBeDisabled();
	});

	test('Reset is off as written, and returns to it while scaled', async () => {
		const first = renderPanel();
		expect(button('Reset')).toBeDisabled();
		first.unmount();
		const { onchange } = renderPanel(STORED * 2);
		await fireEvent.click(button('Reset'));
		expect(onchange).toHaveBeenLastCalledWith(STORED);
	});

	test('Escape asks to close', async () => {
		const { onclose } = renderPanel();
		await fireEvent.keyDown(field(), { key: 'Escape' });
		expect(onclose).toHaveBeenCalled();
	});

	test('opening on a desktop focuses the field with its text selected', () => {
		renderPanel();
		expect(field()).toHaveFocus();
		expect(field().selectionStart).toBe(0);
		expect(field().selectionEnd).toBe(String(STORED).length);
	});

	test('opening on a touch screen focuses the first live button, so no keyboard comes up', () => {
		const matchMedia = vi.fn(() => ({ matches: true }));
		vi.stubGlobal('matchMedia', matchMedia);
		renderPanel(1);
		vi.unstubAllGlobals();
		expect(matchMedia).toHaveBeenCalledWith(expect.stringContaining('pointer: coarse'));
		// − is off at one serving, so + is first.
		expect(button('More servings')).toHaveFocus();
	});

	test('a Makes-only recipe counts its yield and steps half a batch', async () => {
		const content = makeContent({ servings: null, makes: '36 cookies' });
		const { onchange } = renderPanel(36, content);
		expect(field('Makes')).toHaveValue('36');
		await fireEvent.click(button('More cookies'));
		expect(onchange).toHaveBeenLastCalledWith(54);
		await fireEvent.click(button('Fewer cookies'));
		expect(onchange).toHaveBeenLastCalledWith(18);
	});

	test('a small Makes steps one at a time', async () => {
		const content = makeContent({ servings: null, makes: '6 buns' });
		const { onchange } = renderPanel(6, content);
		await fireEvent.click(button('More buns'));
		expect(onchange).toHaveBeenLastCalledWith(7);
	});

	test('a Makes with no count is a multiplier field that steps by a half', async () => {
		const content = makeContent({ servings: null, makes: 'one loaf' });
		const { onchange } = renderPanel(1, content);
		expect(field('Scale')).toHaveValue('1');
		await fireEvent.click(button('Scale up'));
		expect(onchange).toHaveBeenLastCalledWith(1.5);
		await fireEvent.click(button('Scale down'));
		expect(onchange).toHaveBeenLastCalledWith(0.5);
	});

	test('nothing in the panel reads clay: it is what the reader edits', () => {
		const { container } = renderPanel(STORED * 2);
		expect(container.querySelector('.text-accent')).toBeNull();
	});

	// 360px: 324px between the 18px gutters. The group is 32 + 72 + 32 plus
	// its 2px border, the three text buttons 44 each, gaps 16 + 4 + 4: 294.
	test('the steps are drawn narrow, with a thumb’s 44px reached by the hit pattern on a phone', () => {
		const phone = source.slice(source.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		expect(cssRule(source, '.step')).toMatch(/width:\s*32px/);
		expect(cssRule(phone, '.step')).toMatch(/--hit:\s*12px/);
		expect(cssRule(phone, '.scale-row .text-btn')).toMatch(/min-width:\s*44px/);
		// 44px inside its 1px border.
		expect(cssRule(phone, '.scale-group')).toMatch(/height:\s*46px/);
	});

	// At a desktop the text buttons are their words alone, so 4px would run
	// "½× 2× Reset" together: 12px apart, 16px after the group. A phone's 44px
	// boxes keep 4px, the row's 294 at 360.
	test('the text buttons stand apart at a desktop and keep the phone row tight', () => {
		const phone = source.slice(source.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		expect(cssRule(source, '.scale-row')).toMatch(/gap:\s*12px/);
		expect(cssRule(source, '.scale-group')).toMatch(/margin-right:\s*4px/);
		expect(cssRule(phone, '.scale-row')).toMatch(/gap:\s*4px/);
		expect(cssRule(phone, '.scale-group')).toMatch(/margin-right:\s*12px/);
	});
});
