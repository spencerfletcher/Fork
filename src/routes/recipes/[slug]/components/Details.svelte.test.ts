import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Details from './Details.svelte';
import source from './Details.svelte?raw';
import { makeContent } from '#lib/recipes/fixtures.js';
import { cssRule } from '#lib/testing/css.js';

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
			props: { content: makeContent({ servings: 8 }), storedServings: 4 }
		});
		expect(scaled.getByText('8')).toHaveClass('text-accent');
		expect(scaled.getByText('8')).not.toHaveClass('text-text');
		scaled.unmount();

		const stored = render(Details, {
			props: { content: makeContent({ servings: 4 }), storedServings: 4 }
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
		const style = source.slice(source.indexOf('<style>'));
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
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
				props: { content: makeContent({ servings: 6, makes: '12 buns' }), storedServings: 4 }
			});
			expect(scaled.getByText('18 buns')).toHaveClass('text-accent');
			scaled.unmount();

			const stored = render(Details, {
				props: { content: makeContent({ servings: 4, makes: '12 buns' }), storedServings: 4 }
			});
			expect(stored.getByText('12 buns')).toHaveClass('text-text');
			expect(stored.getByText('12 buns')).not.toHaveClass('text-accent');
		});

		test('a pan size is left as typed, ink, and says "not scaled" in Ink 3 only while scaled', () => {
			const scaled = render(Details, {
				props: { content: makeContent({ servings: 8, makes: 'one 9x13 pan' }), storedServings: 4 }
			});
			expect(scaled.getByText('one 9x13 pan')).toHaveClass('text-text');
			expect(scaled.getByText('not scaled')).toHaveClass('text-text-3');
			expect(scaled.getByText('one 9x13 pan').closest('.pair')).toHaveTextContent(
				/Makes\s+one 9x13 pan\s+not scaled/
			);
			scaled.unmount();

			const stored = render(Details, {
				props: { content: makeContent({ servings: 4, makes: 'one 9x13 pan' }), storedServings: 4 }
			});
			expect(stored.queryByText('not scaled')).toBeNull();
		});

		test('a yield with no number ("a dozen") is never flagged', () => {
			const { queryByText } = render(Details, {
				props: { content: makeContent({ servings: 8, makes: 'a dozen' }), storedServings: 4 }
			});
			expect(queryByText('not scaled')).toBeNull();
		});
	});
});
