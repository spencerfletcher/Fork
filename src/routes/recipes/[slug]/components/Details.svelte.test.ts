import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Details from './Details.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

function line(container: HTMLElement) {
	return container.querySelector('.details')!.textContent!.replace(/\s+/g, ' ').trim();
}

describe('Details', () => {
	test('reads times and servings from the content, value then label, on one line', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 6, prepTimeMinutes: 15, cookTimeMinutes: 45 }) }
		});
		// The dots between pairs are drawn by CSS, never typed, so no wrapped
		// line can begin or end with one.
		expect(line(container)).toBe('15 min prep 45 min cook 6 servings');
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
		expect(pairs).toEqual(['15 min prep', '45 min cook', '6 servings']);
		for (const el of container.querySelectorAll('.pair')) {
			expect(el).toHaveClass('whitespace-nowrap');
		}
	});

	test('one serving is singular, and a missing value drops its pair', () => {
		const { container } = render(Details, {
			props: { content: makeContent({ servings: 1, prepTimeMinutes: null, cookTimeMinutes: 45 }) }
		});
		expect(line(container)).toBe('45 min cook 1 serving');
		expect(container.querySelectorAll('.pair')).toHaveLength(2);
	});

	test('renders nothing when there is nothing to show', () => {
		const { container } = render(Details, {
			props: {
				content: makeContent({ servings: null, prepTimeMinutes: null, cookTimeMinutes: null })
			}
		});
		expect(container.querySelector('.details')).toBeNull();
	});
});
