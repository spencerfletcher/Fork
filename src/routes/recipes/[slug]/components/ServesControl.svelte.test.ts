import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ServesControl from './ServesControl.svelte';

const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: { url: new URL('http://localhost/recipes/cookies'), state: {} }
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page }));

const STORED = 4;

/** Renders the control as the page does: it owns the serves and hands them back on change. */
function renderControl(serves = STORED, stored = STORED) {
	const onchange = vi.fn();
	const view = render(ServesControl, { props: { stored, serves, onchange } });
	const rerender = (next: number) => view.rerender({ stored, serves: next, onchange });
	return { ...view, onchange, rerender };
}

const box = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Servings' });

/** The URL handed to the last shallow navigation. */
function lastUrl(): URL {
	const [url, opts] = goto.mock.lastCall!;
	expect(opts).toMatchObject({ shallow: true, replace: true });
	return new URL(url);
}

beforeEach(() => goto.mockClear());

describe('ServesControl', () => {
	test('shows the stored serves in a decimal box then "servings", with no steps, note or Reset', () => {
		renderControl();
		expect(box()).toHaveValue(String(STORED));
		expect(box()).toHaveAttribute('inputmode', 'decimal');
		expect(screen.getByText('servings')).toBeInTheDocument();
		// Spencer, 31 October 2026: the ÷2 and ×2 steps were clutter.
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.queryByText(/^[\d.]+x$/)).toBeNull();
	});

	test('typing a custom amount applies it on change and writes ?serves= with a shallow replace', async () => {
		const { onchange } = renderControl();
		await fireEvent.change(box(), { target: { value: '6' } });
		expect(onchange).toHaveBeenCalledWith(6);
		expect(lastUrl().searchParams.get('serves')).toBe('6');
	});

	test('while scaled, the multiplier shows and Reset is offered', async () => {
		renderControl(6);
		expect(screen.getByText(`${6 / STORED}x`)).toBeInTheDocument();
		expect(box()).toHaveValue('6');
		expect(screen.getByText('servings')).toBeInTheDocument();
	});

	// The box is what the reader edits, not an output: it stays ink while scaled.
	test('the number does not read clay while scaled', () => {
		const { container } = renderControl(STORED * 2);
		expect(container.querySelector('.text-accent')).toBeNull();
	});

	test('Reset returns to the stored serves and drops the param', async () => {
		const { onchange } = renderControl(6);
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onchange).toHaveBeenCalledWith(STORED);
		expect(lastUrl().searchParams.has('serves')).toBe(false);
	});

	test('an invalid entry is put back to the current serves, nothing changes', async () => {
		const { onchange } = renderControl();
		await fireEvent.change(box(), { target: { value: 'lots' } });
		expect(onchange).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
		expect(box()).toHaveValue(String(STORED));
	});

	test('Enter in the box blurs it, which applies it', async () => {
		renderControl();
		box().focus();
		await fireEvent.keyDown(box(), { key: 'Enter' });
		expect(box()).not.toHaveFocus();
	});

	test('the box follows the serves it is given', async () => {
		const { rerender } = renderControl();
		await rerender(9);
		expect(box()).toHaveValue('9');
	});

	test('one serving reads singular', () => {
		renderControl(1);
		expect(screen.getByText('serving')).toBeInTheDocument();
	});
});
