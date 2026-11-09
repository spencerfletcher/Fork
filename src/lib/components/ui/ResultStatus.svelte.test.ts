import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ResultStatus from './ResultStatus.svelte';

describe('ResultStatus', () => {
	test('while filtering, the count and match, singular for one', () => {
		const { rerender } = render(ResultStatus, { props: { count: 1, filtered: true } });
		expect(screen.getByRole('status')).toHaveTextContent('1 recipe matches');
		rerender({ count: 3, filtered: true });
		expect(screen.getByRole('status')).toHaveTextContent('3 recipes match');
	});

	test('unfiltered, silent but present', () => {
		render(ResultStatus, { props: { count: 3, filtered: false } });
		expect(screen.getByRole('status')).toHaveTextContent('');
	});

	test('only a screen reader hears it', () => {
		render(ResultStatus, { props: { count: 0, filtered: true } });
		expect(screen.getByRole('status')).toHaveClass('sr-only');
	});
});
