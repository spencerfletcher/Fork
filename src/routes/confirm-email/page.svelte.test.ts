import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConfirmEmailPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

type Data = {
	state: 'sent' | 'expired' | 'confirmed';
	email: string | null;
	redirectTo: string | null;
};
type Form = { error?: string; sent?: boolean; email?: string } | null;

const renderPage = (data: Partial<Data> = {}, form: Form = null) =>
	render(ConfirmEmailPage, {
		props: { data: { state: 'sent', email: null, redirectTo: null, ...data }, form } as never
	});

const resend = () => screen.getByRole('button', { name: 'Resend link' });

describe('Confirm email page', () => {
	test('names the address the link went to and resends to it without asking again', () => {
		renderPage({ email: 'cook@b.com' });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Check your email');
		expect(screen.getByText(/We sent a confirmation link to cook@b\.com\./)).toBeInTheDocument();
		expect(screen.queryByLabelText('Email')).toBeNull();
		expect(resend()).toBeInTheDocument();
	});

	test('a mistyped address goes back to sign up, where the cookie fills the form', () => {
		renderPage({ email: 'cook@b.con' });
		expect(screen.getByRole('link', { name: 'Sign up again' })).toHaveAttribute('href', '/signup');
	});

	test('without the address it says so generically and asks for it', () => {
		renderPage();
		expect(
			screen.getByText(/We sent a confirmation link to the address you signed up with\./)
		).toBeInTheDocument();
		const email = screen.getByLabelText('Email');
		expect(email).toHaveAttribute('type', 'email');
		expect(email).toBeRequired();
		expect(screen.queryByRole('link', { name: 'Sign up again' })).toBeNull();
	});

	test('a bad email, once edited and left, is announced under the field and describes it', async () => {
		renderPage();
		const email = screen.getByLabelText('Email');
		await fireEvent.input(email, { target: { value: 'jane@' } });
		await fireEvent.blur(email);
		const rule = 'Enter an email address like name@example.com';
		expect(screen.getByRole('alert')).toHaveTextContent(rule);
		expect(email).toHaveAttribute('aria-invalid', 'true');
		expect(email).toHaveAccessibleDescription(rule);
	});

	test('the way on is "Log in", carrying the redirectTo signup handed on', () => {
		renderPage({ redirectTo: '/recipes/cookies' });
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
			'href',
			'/login?redirectTo=%2Frecipes%2Fcookies'
		);
	});

	test('a resend is announced the same way for any address, and takes the focus', () => {
		renderPage({ email: 'cook@b.com' }, { sent: true, email: 'cook@b.com' });
		const status = screen.getByRole('status');
		expect(status).toHaveTextContent(
			'If cook@b.com is waiting to be confirmed, a new link is on its way.'
		);
		expect(status.contains(document.activeElement)).toBe(true);
	});

	test('a refusal shows in the alert and takes the focus, the button still there', () => {
		renderPage({ email: 'cook@b.com' }, { error: 'Wait 42 seconds before asking again.' });
		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent('Wait 42 seconds before asking again.');
		expect(alert).toHaveFocus();
		expect(resend()).toBeInTheDocument();
	});

	test('an expired or used link says so and offers a new one', () => {
		renderPage({ state: 'expired', email: 'cook@b.com' });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Link expired');
		expect(screen.getByText(/expired or was already used/)).toBeInTheDocument();
		expect(resend()).toBeInTheDocument();
	});

	test('a link confirmed on another device says the account is ready and leads to Log in', () => {
		renderPage({ state: 'confirmed' });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Email confirmed');
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
		expect(screen.queryByRole('button', { name: 'Resend link' })).toBeNull();
	});
});
