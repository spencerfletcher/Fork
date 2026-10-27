import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Details from './Details.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

describe('Details', () => {
	test('reads servings and times from the content it is given', () => {
		render(Details, {
			props: { content: makeContent({ servings: 6, prepTimeMinutes: 15, cookTimeMinutes: 45 }) }
		});
		expect(screen.getByText('6')).toBeInTheDocument();
		expect(screen.getByText('15 min')).toBeInTheDocument();
		expect(screen.getByText('45 min')).toBeInTheDocument();
		expect(screen.queryByRole('heading')).toBeNull();
	});

	test('renders nothing when there is nothing to show', () => {
		const { container } = render(Details, {
			props: {
				content: makeContent({ servings: null, prepTimeMinutes: null, cookTimeMinutes: null })
			}
		});
		expect(container.querySelector('dl')).toBeNull();
	});
});
