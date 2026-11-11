import { describe, test, expect, vi, beforeEach } from 'vitest';
import { lastShallowUrl } from '#lib/testing/navigation.js';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ServesControl from './ServesControl.svelte';
import { MIN_SERVES } from '#lib/recipes/scale.js';
import source from './ServesControl.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

const style = source.slice(source.indexOf('<style>'));

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
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe(String(STORED + 1));
	});

	test('typing a custom amount applies it on change and writes ?serves= with a shallow replace', async () => {
		const { onchange } = renderControl();
		await fireEvent.change(box(), { target: { value: '6' } });
		expect(onchange).toHaveBeenCalledWith(6);
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe('6');
	});

	test('while scaled, the multiplier shows and Reset is offered', async () => {
		renderControl(6);
		expect(screen.getByText(`${6 / STORED}x`)).toBeInTheDocument();
		expect(box()).toHaveValue(6);
		expect(screen.getByText('servings')).toBeInTheDocument();
	});

	// The box is what the reader edits, not an output: it stays ink while scaled.
	// Left-aligned, so what appears grows rightward after the label.
	test('the multiplier and Reset come after the box and its label, so the box holds still as they change', () => {
		renderControl(STORED * 1.5);
		const note = screen.getByText(`${1.5}x`);
		const reset = screen.getByRole('button', { name: 'Reset' });
		const follows = (a: Node, b: Node) =>
			!!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
		expect(follows(box(), screen.getByText('servings'))).toBe(true);
		expect(follows(screen.getByText('servings'), note)).toBe(true);
		expect(follows(note, reset)).toBe(true);
	});

	test('it sits at the start of its row, never pushed to the end', () => {
		expect(cssRule(style, '.serves')).not.toMatch(/auto/);
	});

	// On a phone the 44px box is centred on its line, 10px above and below, so
	// the control sits an even gap between the tabs' rule and the list's.
	test('on a phone the box holds its number centred, the underline under the digits', () => {
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
		const input = cssRule(phone, 'input');
		expect(input).toMatch(/height:\s*44px/);
		expect(input).toMatch(/padding:\s*10px 0/);
		expect(cssRule(style, 'input')).toMatch(/background:[^;]*linear-gradient/);
	});

	test('forced colours, which drop the drawn underline, get a border', () => {
		const forced = style.slice(style.indexOf('@media (forced-colors: active)'));
		expect(cssRule(forced, 'input')).toMatch(/border-bottom:\s*1px solid CanvasText/);
	});

	test('the number does not read clay while scaled', () => {
		const { container } = renderControl(STORED * 2);
		expect(container.querySelector('.text-accent')).toBeNull();
	});

	test('Reset returns to the stored serves and drops the param', async () => {
		const { onchange } = renderControl(6);
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onchange).toHaveBeenCalledWith(STORED);
		expect(lastShallowUrl(goto).searchParams.has('serves')).toBe(false);
	});

	test('Reset hands focus to the box as it leaves, so the keyboard is not dropped', async () => {
		const { rerender } = renderControl(6);
		const reset = screen.getByRole('button', { name: 'Reset' });
		reset.focus();
		await fireEvent.click(reset);
		await rerender(STORED);
		expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
		expect(box()).toHaveFocus();
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
		expect(lastShallowUrl(goto).searchParams.get('cook')).toBe('1');
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe(String(STORED * 2));
	});
});
