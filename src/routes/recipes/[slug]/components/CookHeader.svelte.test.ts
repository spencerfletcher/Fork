import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookHeader from './CookHeader.svelte';
import source from './CookHeader.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import { makeContent } from '#lib/recipes/fixtures.js';
import { scaling } from '#lib/recipes/scale.js';

const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: { url: new URL('http://localhost/recipes/cookies'), state: {}, shallow: null }
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page }));

const TITLE = 'Chicken Tikka Masala';

function makeProps(overrides: Record<string, unknown> = {}) {
	const content = makeContent({ servings: 4 });
	return {
		title: TITLE,
		onexit: () => {},
		content,
		scale: scaling(content, null),
		onscale: () => {},
		...overrides
	};
}

describe('CookHeader', () => {
	test('a small Cooking label, then the title as the page heading', () => {
		render(CookHeader, { props: makeProps() });
		expect(screen.getByText('Cooking')).toHaveClass('eyebrow-label');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(TITLE);
	});

	// The yield with Scale is the one place cooking says the serves: the
	// recipe header's facts line, without its times, and the same scaler.
	test('the yield and Scale under the title, the times left to the method', async () => {
		const content = makeContent({ servings: 4, cookTimeMinutes: 45 });
		const onscale = vi.fn();
		render(CookHeader, { props: makeProps({ content, scale: scaling(content, 6), onscale }) });
		const facts = document.querySelector('.cook-header .details')!;
		expect(facts.textContent!.replace(/\s+/g, ' ').trim()).toBe('Serves 6 Scale Reset');
		await fireEvent.click(screen.getByRole('button', { name: 'Scale' }));
		await fireEvent.click(screen.getByRole('button', { name: '2× (double)' }));
		expect(onscale).toHaveBeenLastCalledWith(12);
	});

	// The panel's five controls need the header's full width at 360px, so the
	// yield sits under both the title and Exit.
	test('the yield spans the header, under the title and Exit', () => {
		expect(cssRule(source, '.yield')).toMatch(/grid-column:\s*1\s*\/\s*-1/);
	});

	test('a recipe with no yield has no line and no Scale', () => {
		const content = makeContent({ servings: null, makes: null });
		render(CookHeader, { props: makeProps({ content, scale: null, onscale: vi.fn() }) });
		expect(screen.queryByRole('button', { name: 'Scale' })).toBeNull();
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
