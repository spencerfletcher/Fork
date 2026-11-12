import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Details from './Details.svelte';
import { TYPING_PAUSE_MS } from './ScalePanel.svelte';
import { lastShallowUrl } from '#lib/testing/navigation.js';
import source from './Details.svelte?raw';
import { makeContent } from '#lib/recipes/fixtures.js';
import { scaling } from '#lib/recipes/scale.js';
import { cssRule } from '#lib/testing/css.js';

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

function line(container: HTMLElement) {
	return container.querySelector('.details')!.textContent!.replace(/\s+/g, ' ').trim();
}

describe('Details', () => {
	test('reads times value then label and the serves label then value, on one line', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 6, prepTimeMinutes: 15, cookTimeMinutes: 45 }) }
		});
		// The dots between pairs are drawn by CSS, never typed, so no wrapped
		// line can begin or end with one.
		expect(line(container)).toBe('15 min prep 45 min cook Serves 6');
		expect(container.querySelector('.dot')).toBeNull();
		expect(container.querySelector('h2, h3, h4, dl')).toBeNull();
	});

	test('rest is its own pair after cook, and nothing adds the times up', () => {
		const { container } = render(Details, {
			props: {
				content: makeContent({ prepTimeMinutes: 15, cookTimeMinutes: 45, restTimeMinutes: 480 })
			}
		});
		const pairs = [...container.querySelectorAll('.pair')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(pairs.slice(0, 3)).toEqual(['15 min prep', '45 min cook', '8 h rest']);
		expect(container.textContent).not.toMatch(/total/i);
	});

	test('a pair never splits: each value and label share one no-wrap span', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 6, prepTimeMinutes: 15, cookTimeMinutes: 45 }) }
		});
		const pairs = [...container.querySelectorAll('.pair')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(pairs).toEqual(['15 min prep', '45 min cook', 'Serves 6']);
		for (const el of container.querySelectorAll('.pair')) {
			expect(el).toHaveClass('whitespace-nowrap');
		}
	});

	test('one serving reads Serves 1, and a missing value drops its pair', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 1, prepTimeMinutes: null, cookTimeMinutes: 45 }) }
		});
		expect(line(container)).toBe('45 min cook Serves 1');
		expect(container.querySelectorAll('.pair')).toHaveLength(2);
	});

	test('the serves value reads clay while it differs from the stored serves, ink otherwise', () => {
		const scaled = render(Details, {
			props: {
				content: makeContent({ servings: 4 }),
				scale: scaling(makeContent({ servings: 4 }), 8)
			}
		});
		expect(scaled.getByText('8')).toHaveClass('text-accent');
		expect(scaled.getByText('8')).not.toHaveClass('text-text');
		scaled.unmount();

		const stored = render(Details, {
			props: {
				content: makeContent({ servings: 4 }),
				scale: scaling(makeContent({ servings: 4 }), 4)
			}
		});
		expect(stored.getByText('4')).toHaveClass('text-text');
		expect(stored.getByText('4')).not.toHaveClass('text-accent');
	});

	test('the times are one line and the yield another: prep · cook, then Serves · Makes', () => {
		const { container } = render(Details, {
			props: {
				content: makeContent({
					servings: 6,
					makes: '12 buns',
					prepTimeMinutes: 15,
					cookTimeMinutes: 45
				})
			}
		});
		const lines = [...container.querySelectorAll('.details > .line')].map((el) =>
			[...el.querySelectorAll('.pair')].map((pair) => pair.textContent!.replace(/\s+/g, ' ').trim())
		);
		expect(lines).toEqual([
			['15 min prep', '45 min cook'],
			['Serves 6', 'Makes 12 buns']
		]);
	});

	test('with no times there is one line, the yield', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 6, prepTimeMinutes: null, cookTimeMinutes: null }) }
		});
		expect(container.querySelectorAll('.line')).toHaveLength(1);
	});

	test('one line on a desktop, dotted between the groups; two lines on a phone', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		// The dots are app.css's .dot-list, between the lines and between the pairs.
		const { container } = render(Details, { props: { content: makeContent() } });
		expect(container.querySelector('.details')).toHaveClass('dot-list');
		expect(container.querySelector('.line')).toHaveClass('dot-list');
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		expect(cssRule(phone, '.line')).toMatch(/display: block/);
		expect(cssRule(phone, '.line + .line::before')).toMatch(/content: none/);
	});

	test('renders nothing when there is nothing to show', () => {
		const { container } = render(Details, {
			props: {
				content: makeContent({ servings: null, prepTimeMinutes: null, cookTimeMinutes: null })
			}
		});
		expect(container.querySelector('.details')).toBeNull();
	});

	describe('makes', () => {
		test('follows serves as label then value: "Serves 4 · Makes 12 buns"', () => {
			const { container } = render(Details, {
				props: {
					content: makeContent({
						servings: 4,
						makes: '12 buns',
						prepTimeMinutes: null,
						cookTimeMinutes: null
					})
				}
			});
			expect(line(container)).toBe('Serves 4 Makes 12 buns');
			expect(container.querySelectorAll('.pair')).toHaveLength(2);
		});

		test('reads alone when there are no servings, and is never read as servings', () => {
			const { container } = render(Details, {
				props: {
					content: makeContent({
						servings: null,
						makes: '12 buns',
						prepTimeMinutes: null,
						cookTimeMinutes: null
					})
				}
			});
			expect(line(container)).toBe('Makes 12 buns');
		});

		test('scales with servings and reads clay while scaled, ink at the stored serves', () => {
			const scaled = render(Details, {
				props: {
					content: makeContent({ servings: 4, makes: '12 buns' }),
					scale: scaling(makeContent({ servings: 4, makes: '12 buns' }), 6)
				}
			});
			expect(scaled.getByText('18 buns')).toHaveClass('text-accent');
			scaled.unmount();

			const stored = render(Details, {
				props: {
					content: makeContent({ servings: 4, makes: '12 buns' }),
					scale: scaling(makeContent({ servings: 4, makes: '12 buns' }), 4)
				}
			});
			expect(stored.getByText('12 buns')).toHaveClass('text-text');
			expect(stored.getByText('12 buns')).not.toHaveClass('text-accent');
		});

		test('a pan size is left as typed, ink, and says "not scaled" in Ink 3 only while scaled', () => {
			const scaled = render(Details, {
				props: {
					content: makeContent({ servings: 4, makes: 'one 9x13 pan' }),
					scale: scaling(makeContent({ servings: 4, makes: 'one 9x13 pan' }), 8)
				}
			});
			expect(scaled.getByText('one 9x13 pan')).toHaveClass('text-text');
			expect(scaled.getByText('not scaled')).toHaveClass('text-text-3');
			expect(scaled.getByText('one 9x13 pan').closest('.pair')).toHaveTextContent(
				/Makes\s+one 9x13 pan\s+not scaled/
			);
			scaled.unmount();

			const stored = render(Details, {
				props: {
					content: makeContent({ servings: 4, makes: 'one 9x13 pan' }),
					scale: scaling(makeContent({ servings: 4, makes: 'one 9x13 pan' }), 4)
				}
			});
			expect(stored.queryByText('not scaled')).toBeNull();
		});

		test('a Makes-only recipe scales its yield by its own count, clay while scaled', () => {
			const content = makeContent({ servings: null, makes: '36 cookies' });
			const { getByText } = render(Details, { props: { content, scale: scaling(content, 72) } });
			expect(getByText('72 cookies')).toHaveClass('text-accent');
		});

		test('a yield with no number ("a dozen") is never flagged', () => {
			const { queryByText } = render(Details, {
				props: {
					content: makeContent({ servings: 4, makes: 'a dozen' }),
					scale: scaling(makeContent({ servings: 4, makes: 'a dozen' }), 8)
				}
			});
			expect(queryByText('not scaled')).toBeNull();
		});
	});
});

describe('Details with the scaler', () => {
	const STORED = 3;
	const SERVES = makeContent({ servings: STORED, cookTimeMinutes: 45 });

	/** As the page renders it: the page owns the count, Details hands it back. */
	function renderScaler(content = SERVES, count: number | null = null) {
		const onscale = vi.fn((next: number) =>
			view.rerender({ content, scale: scaling(content, next), onscale })
		);
		const view = render(Details, { props: { content, scale: scaling(content, count), onscale } });
		return { ...view, onscale };
	}

	const trigger = () => screen.getByRole('button', { name: 'Scale' });
	const field = (name = 'Servings') => screen.getByRole<HTMLInputElement>('textbox', { name });
	const resets = () => screen.queryAllByRole('button', { name: 'Reset' });

	beforeEach(() => {
		goto.mockClear();
		page.shallow = null;
	});

	test('"Scale" follows the yield on its line, a closed disclosure; nothing else at rest', () => {
		const { container } = renderScaler();
		expect(line(container)).toMatch(/cook Serves 3 Scale$/);
		expect(trigger()).toHaveClass('text-btn');
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(trigger()).toHaveAttribute('aria-controls', 'scale-panel');
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(resets()).toHaveLength(0);
	});

	test('with no onscale (a page that cannot scale), there is no Scale', () => {
		render(Details, { props: { content: SERVES } });
		expect(screen.queryByRole('button', { name: 'Scale' })).toBeNull();
	});

	test('"Makes 36 cookies · Scale", and a count-less Makes too', () => {
		const cookies = renderScaler(makeContent({ servings: null, makes: '36 cookies' }));
		expect(line(cookies.container)).toMatch(/cook Makes 36 cookies Scale$/);
		cookies.unmount();
		const loaf = renderScaler(makeContent({ servings: null, makes: 'one loaf' }));
		expect(line(loaf.container)).toMatch(/cook Makes one loaf Scale$/);
	});

	test('Scale opens the panel under the line, its field focused; Scale again closes it', async () => {
		const { container } = renderScaler();
		await fireEvent.click(trigger());
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		const panel = container.querySelector('#scale-panel')!;
		expect(container.querySelector('.details')!.nextElementSibling).toBe(panel);
		expect(field()).toHaveFocus();
		await fireEvent.click(trigger());
		expect(container.querySelector('#scale-panel')).toBeNull();
	});

	test('Escape closes the panel and hands focus back to Scale', async () => {
		renderScaler();
		await fireEvent.click(trigger());
		await fireEvent.keyDown(field(), { key: 'Escape' });
		await tick();
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(trigger()).toHaveFocus();
	});

	test('a change scales the line in clay and writes ?serves= by a shallow replace; 1x drops it', async () => {
		const { onscale } = renderScaler();
		await fireEvent.click(trigger());
		await fireEvent.click(screen.getByRole('button', { name: '2× (double)' }));
		expect(onscale).toHaveBeenLastCalledWith(STORED * 2);
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe(String(STORED * 2));
		expect(screen.getByText(String(STORED * 2))).toHaveClass('text-accent');
		await fireEvent.click(screen.getByRole('button', { name: '½× (halve)' }));
		expect(lastShallowUrl(goto).searchParams.has('serves')).toBe(false);
	});

	test('a Makes-only recipe writes ?makes=, a bare multiplier ?scale=', async () => {
		const cookies = renderScaler(makeContent({ servings: null, makes: '36 cookies' }));
		await fireEvent.click(trigger());
		await fireEvent.input(field('Makes'), { target: { value: '72' } });
		expect(lastShallowUrl(goto).searchParams.get('makes')).toBe('72');
		expect(screen.getByText('72 cookies')).toHaveClass('text-accent');
		cookies.unmount();
		renderScaler(makeContent({ servings: null, makes: 'one loaf' }));
		await fireEvent.click(trigger());
		await fireEvent.input(field('Scale'), { target: { value: '2x' } });
		expect(lastShallowUrl(goto).searchParams.get('scale')).toBe('2');
	});

	test('a scale after Cook keeps ?cook=1: it builds on the newest shallow URL', async () => {
		page.shallow = { url: new URL('http://localhost/recipes/cookies?cook=1') };
		renderScaler();
		await fireEvent.click(trigger());
		await fireEvent.click(screen.getByRole('button', { name: '2× (double)' }));
		expect(lastShallowUrl(goto).searchParams.get('cook')).toBe('1');
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe(String(STORED * 2));
	});

	test('closed while scaled, the line offers Reset beside Scale; it returns to 1x and focus to Scale', async () => {
		const { container, onscale } = renderScaler(SERVES, STORED * 2);
		expect(line(container)).toMatch(new RegExp(`cook Serves ${STORED * 2} Scale Reset$`));
		await fireEvent.click(resets()[0]);
		expect(onscale).toHaveBeenLastCalledWith(STORED);
		expect(lastShallowUrl(goto).searchParams.has('serves')).toBe(false);
		await tick();
		expect(resets()).toHaveLength(0);
		expect(trigger()).toHaveFocus();
	});

	test('open while scaled, the one Reset is the panel’s', async () => {
		renderScaler(SERVES, STORED * 2);
		await fireEvent.click(trigger());
		expect(resets()).toHaveLength(1);
		expect(screen.getByRole('group', { name: 'Scale this recipe' })).toContainElement(resets()[0]);
	});

	describe('the announcement', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		const status = () => screen.getByRole('status');

		test('says the new yield once typing pauses, not each keystroke', async () => {
			renderScaler();
			await fireEvent.click(trigger());
			await fireEvent.input(field(), { target: { value: '1' } });
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS - 1);
			expect(status()).toHaveTextContent(/^$/);
			await fireEvent.input(field(), { target: { value: '12' } });
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS);
			expect(status()).toHaveTextContent('Serves 12');
		});

		test('a Makes says its scaled yield; a bare multiplier its scale', async () => {
			const cookies = renderScaler(makeContent({ servings: null, makes: '36 cookies' }));
			await fireEvent.click(trigger());
			await fireEvent.click(screen.getByRole('button', { name: '2× (double)' }));
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS);
			expect(status()).toHaveTextContent('Makes 72 cookies');
			cookies.unmount();
			renderScaler(makeContent({ servings: null, makes: 'one loaf' }));
			await fireEvent.click(trigger());
			await fireEvent.click(screen.getByRole('button', { name: '2× (double)' }));
			await vi.advanceTimersByTimeAsync(TYPING_PAUSE_MS);
			expect(status()).toHaveTextContent('Scaled 2x');
		});
	});
});
