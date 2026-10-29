import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import LoginPage from './+page.svelte';

// The enhance mock keeps the page's submit callback so a test can start a
// submission without a server.
const { submits } = vi.hoisted(() => ({ submits: [] as Array<() => unknown> }));
vi.mock('$app/forms', () => ({
	enhance: (_form: HTMLFormElement, submit: () => unknown) => {
		submits.push(submit);
		return { destroy: () => {} };
	}
}));

function renderLogin(redirectTo: string | null = null) {
	return render(LoginPage, { props: { form: null, data: { redirectTo } } as never });
}

describe('Login page', () => {
	test('"Log in" everywhere: the subtitle and the button, under "Welcome Back"', () => {
		renderLogin();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome Back');
		expect(screen.getByText('Log in to your cookbook')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
		expect(screen.queryByText(/sign in/i)).toBeNull();
	});

	test.each([
		['/favorites', 'Log in to see your favorites'],
		['/recipes/new', 'Log in to continue'],
		['/recipes/classic-cookies?version=2', 'Log in to continue']
	])('sent from %s, the subtitle names the reason: "%s"', (redirectTo, subtitle) => {
		renderLogin(redirectTo);
		expect(screen.getByText(subtitle)).toHaveClass('auth-subtitle');
		expect(screen.queryByText('Log in to your cookbook')).toBeNull();
	});

	test('the fields carry autocomplete tokens, and the password no placeholder', () => {
		renderLogin();
		expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
		const password = screen.getByLabelText('Password');
		expect(password).toHaveAttribute('autocomplete', 'current-password');
		expect(password).not.toHaveAttribute('placeholder');
	});

	test('"Create one" forwards redirectTo to sign-up', () => {
		const { unmount } = renderLogin('/favorites');
		expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute(
			'href',
			'/signup?redirectTo=%2Ffavorites'
		);
		unmount();
		renderLogin();
		expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/signup');
	});

	test('"Forgot password?" sits under the password field and leads to the reset page', () => {
		renderLogin();
		const link = screen.getByRole('link', { name: 'Forgot password?' });
		expect(link).toHaveAttribute('href', '/forgot-password');
		expect(link.closest('.field')).toContainElement(screen.getByLabelText('Password'));
	});

	test('while the form is submitting the button is disabled and says so', async () => {
		submits.length = 0;
		renderLogin();
		submits.at(-1)!();
		await tick();
		const button = screen.getByRole('button', { name: 'Logging in…' });
		expect(button).toBeDisabled();
	});
});
