import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConfirmEmailPage from './+page.svelte';

test('the way on is "Log in", the verb every link to login uses', () => {
	render(ConfirmEmailPage, { props: { data: { redirectTo: null } } });
	expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
});

test('Log in carries the redirectTo signup handed on', () => {
	render(ConfirmEmailPage, { props: { data: { redirectTo: '/recipes/cookies' } } });
	expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
		'href',
		'/login?redirectTo=%2Frecipes%2Fcookies'
	);
});
