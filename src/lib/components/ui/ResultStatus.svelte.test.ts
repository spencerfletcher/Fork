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

	test('by default only a screen reader hears it', () => {
		render(ResultStatus, { props: { count: 0, filtered: true, class: 'line' } });
		expect(screen.getByRole('status')).toHaveClass('sr-only');
		expect(screen.getByRole('status')).not.toHaveClass('line');
	});

	test('visible: seen when nothing matches, screen reader only over results', () => {
		const props = { filtered: true, visible: true, class: 'line' };
		const { rerender } = render(ResultStatus, { props: { ...props, count: 0 } });
		const status = screen.getByRole('status');
		expect(status).toHaveClass('line');
		expect(status.firstElementChild).not.toHaveClass('sr-only');
		rerender({ ...props, count: 2 });
		expect(status.firstElementChild).toHaveClass('sr-only');
	});
});
