import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookHeader from './CookHeader.svelte';
import source from './CookHeader.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import { formatServes } from '#lib/recipes/scale.js';

const TITLE = 'Chicken Tikka Masala';

function makeProps(overrides: Record<string, unknown> = {}) {
	return { title: TITLE, stored: 4, serves: 4, onexit: () => {}, ...overrides };
}

const servesLine = () =>
	document.querySelector('.serves')!.textContent!.replace(/\s+/g, ' ').trim();

describe('CookHeader', () => {
	test('a small Cooking label, then the title as the page heading', () => {
		render(CookHeader, { props: makeProps() });
		expect(screen.getByText('Cooking')).toHaveClass('eyebrow-label');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(TITLE);
	});

	test('unscaled: Serves and the stored number, no multiplier, nothing clay', () => {
		render(CookHeader, { props: makeProps() });
		expect(servesLine()).toBe('Serves 4');
		expect(document.querySelector('.serves .text-accent')).toBeNull();
	});

	test('scaled: the serves and the multiplier in clay, as the scaler writes it', () => {
		const stored = 4;
		const serves = 6;
		render(CookHeader, { props: makeProps({ stored, serves }) });
		const factor = `${formatServes(serves / stored)}x`;
		expect(servesLine()).toBe(`Serves ${serves} ${factor}`);
		// The dot is drawn for the eye only, by app.css's .dot-list.
		expect(document.querySelector('.serves')).toHaveClass('dot-list');
		const clay = [...document.querySelectorAll('.serves .text-accent')].map((e) => e.textContent);
		expect(clay).toEqual([String(serves), factor]);
	});

	test('a version with no servings has no serves line', () => {
		render(CookHeader, { props: makeProps({ stored: 0, serves: 0 }) });
		expect(document.querySelector('.serves')).toBeNull();
	});

	test('Exit is a quiet ink text button that hands back to the page', async () => {
		const onexit = vi.fn();
		render(CookHeader, { props: makeProps({ onexit }) });
		const exit = screen.getByRole('button', { name: 'Exit' });
		expect(exit).toHaveClass('text-btn', 'text-btn--ink');
		expect(exit).not.toHaveClass('btn-primary');
		await fireEvent.click(exit);
		expect(onexit).toHaveBeenCalledOnce();
	});

	test('the title stays within two lines; the whole of it stays in the page', () => {
		render(CookHeader, { props: makeProps({ title: 'A '.repeat(80) + 'end' }) });
		expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('end');
		expect(cssRule(source, '.title')).toMatch(/line-clamp: 2;/);
	});

	test('paper, not espresso, and padded under the status bar', () => {
		const rule = cssRule(source, '.cook-header');
		expect(rule).toMatch(/background: var\(--color-bg\);/);
		expect(rule).toMatch(/env\(safe-area-inset-top\)/);
	});
});

// The header is mounted only while cooking, so it holds the screen awake for
// as long as it is there.
describe('CookHeader wake lock', () => {
	type Sentinel = { released: boolean; release: ReturnType<typeof vi.fn> };
	let sentinels: Sentinel[];
	let request: ReturnType<typeof vi.fn>;

	function setVisibility(state: 'visible' | 'hidden') {
		Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
		document.dispatchEvent(new Event('visibilitychange'));
	}

	beforeEach(() => {
		sentinels = [];
		request = vi.fn(async () => {
			const sentinel: Sentinel = {
				released: false,
				release: vi.fn(async () => {
					sentinel.released = true;
				})
			};
			sentinels.push(sentinel);
			return sentinel;
		});
		Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
	});

	afterEach(() => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		Reflect.deleteProperty(document, 'visibilityState');
	});

	test('the screen lock is requested and no note shows', async () => {
		render(CookHeader, { props: makeProps() });
		await tick();
		expect(request).toHaveBeenCalledWith('screen');
		expect(screen.queryByText('Your screen may still sleep.')).toBeNull();
	});

	test('the browser drops the lock when the tab hides; coming back asks again', async () => {
		render(CookHeader, { props: makeProps() });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		sentinels[0].released = true;
		setVisibility('hidden');
		expect(request).toHaveBeenCalledTimes(1);
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(2);
	});

	test('a lock still held is not asked for twice', async () => {
		render(CookHeader, { props: makeProps() });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(1);
	});

	test('leaving cooking releases the lock, and the tab coming back does not ask again', async () => {
		const { unmount } = render(CookHeader, { props: makeProps() });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		unmount();
		expect(sentinels[0].release).toHaveBeenCalled();
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(1);
	});

	test('unloading releases the lock; back from the back-forward cache it comes back', async () => {
		render(CookHeader, { props: makeProps() });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		window.dispatchEvent(new Event('pagehide'));
		expect(sentinels[0].release).toHaveBeenCalled();
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(2);
	});

	test('a lock that arrives after leaving is let go at once', async () => {
		const { unmount } = render(CookHeader, { props: makeProps() });
		unmount();
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		await vi.waitFor(() => expect(sentinels[0].release).toHaveBeenCalled());
	});

	test('a refused lock does not throw; cooking goes on', async () => {
		request.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
		render(CookHeader, { props: makeProps() });
		await tick();
		await tick();
		expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument();
	});

	test('without the API one quiet line says the screen may sleep', async () => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		render(CookHeader, { props: makeProps() });
		await tick();
		expect(screen.getByText('Your screen may still sleep.')).toHaveClass('form-hint');
	});
});
