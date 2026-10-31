import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ServesControl from './ServesControl.svelte';
import { MIN_SERVES } from '#lib/recipes/scale.js';

const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: {
		url: new URL('http://localhost/recipes/cookies'),
		state: {},
		shallow: null as { url: URL } | null
	}
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

const box = () => screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Servings' });

/** The URL handed to the last shallow navigation. */
function lastUrl(): URL {
	const [url, opts] = goto.mock.lastCall!;
	expect(opts).toMatchObject({ shallow: true, replace: true });
	return new URL(url);
}

beforeEach(() => {
	goto.mockClear();
	page.shallow = null;
});

describe('ServesControl', () => {
	test('shows the stored serves in a decimal box then "servings", with no steps, note or Reset', () => {
		renderControl();
		expect(box()).toHaveValue(STORED);
		expect(box()).toHaveAttribute('inputmode', 'decimal');
		expect(screen.getByText('servings')).toBeInTheDocument();
		// Spencer, 31 October 2026: the ÷2 and ×2 steps were clutter.
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.queryByText(/^[\d.]+x$/)).toBeNull();
	});

	// Spencer, 31 October 2026: "add an up down selector ... regular HTML one
	// is fine". step="any" keeps a typed 1.5 valid; the arrows still step by 1.
	test('the box is a native number spinner from the minimum serves, any step', () => {
		renderControl();
		expect(box()).toHaveAttribute('type', 'number');
		expect(box()).toHaveAttribute('step', 'any');
		expect(box()).toHaveAttribute('min', String(MIN_SERVES));
	});

	test('stepping up from the stored serves applies one more, as a change does', async () => {
		const { onchange } = renderControl();
		// A browser's arrow step sets the next value and fires change; jsdom
		// cannot step under step="any", so the e2e spec presses ArrowUp.
		await fireEvent.change(box(), { target: { value: String(STORED + 1) } });
		expect(onchange).toHaveBeenCalledWith(STORED + 1);
		expect(lastUrl().searchParams.get('serves')).toBe(String(STORED + 1));
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
		expect(box()).toHaveValue(6);
		expect(screen.getByText('servings')).toBeInTheDocument();
	});

	// The box is what the reader edits, not an output: it stays ink while scaled.
	test('the multiplier and Reset come before the box, so the box holds still as they change', () => {
		renderControl(STORED * 1.5);
		const note = screen.getByText(`${1.5}x`);
		const reset = screen.getByRole('button', { name: 'Reset' });
		const follows = (a: Node, b: Node) =>
			!!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
		expect(follows(note, reset)).toBe(true);
		expect(follows(reset, box())).toBe(true);
		expect(follows(box(), screen.getByText('servings'))).toBe(true);
	});

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
		expect(box()).toHaveValue(STORED);
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
		expect(box()).toHaveValue(9);
	});

	test('one serving reads singular', () => {
		renderControl(1);
		expect(screen.getByText('serving')).toBeInTheDocument();
	});
});

describe('ServesControl and the other shallow writes', () => {
	test('a scale after Cook keeps ?cook=1: it builds on the newest shallow URL', async () => {
		page.shallow = { url: new URL('http://localhost/recipes/cookies?cook=1') };
		renderControl();
		await fireEvent.change(box(), { target: { value: String(STORED * 2) } });
		expect(lastUrl().searchParams.get('cook')).toBe('1');
		expect(lastUrl().searchParams.get('serves')).toBe(String(STORED * 2));
	});
});
