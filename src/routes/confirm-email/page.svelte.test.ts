import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConfirmEmailPage from './+page.svelte';

test('the way on is "Log in", the verb every link to login uses', () => {
	render(ConfirmEmailPage);
	expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
});
