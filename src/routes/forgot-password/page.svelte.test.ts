import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ForgotPasswordPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

type Form = { message?: string; sent?: boolean; email?: string } | null;

const renderForgot = (form: Form = null) =>
	render(ForgotPasswordPage, { props: { form, data: {} } as never });

const email = () => screen.getByLabelText('Email') as HTMLInputElement;

describe('Forgot password page', () => {
	test('asks for the email and offers one action, "Send reset link"', () => {
		renderForgot();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Forgot your password?');
		const email = screen.getByLabelText('Email');
		expect(email).toHaveAttribute('type', 'email');
		expect(email).toHaveAttribute('autocomplete', 'email');
		expect(email).toBeRequired();
		expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
	});

	test('a failure shows in the alert and keeps the form', () => {
		renderForgot({ message: 'Could not send the link. Try again in a minute.' });
		expect(screen.getByRole('alert')).toHaveTextContent(
			'Could not send the link. Try again in a minute.'
		);
		expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
	});

	const EMAIL_RULE = 'Enter an email address like name@example.com';

	test('an email the browser rejects, once edited and left: the message is described and the field invalid', async () => {
		renderForgot();
		// Passing through without typing says nothing.
		await fireEvent.blur(email());
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		expect(email()).not.toHaveAttribute('aria-invalid');
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		// Not while typing the first time.
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		await fireEvent.blur(email());
		expect(screen.getByText(EMAIL_RULE)).toHaveClass('field-error');
		expect(email()).toHaveAttribute('aria-invalid', 'true');
		expect(email()).toHaveAttribute('aria-describedby', 'email-error');
		expect(email()).toHaveAccessibleDescription(EMAIL_RULE);
		// Fixed, it clears at once.
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		expect(email()).not.toHaveAttribute('aria-invalid');
		expect(email()).not.toHaveAttribute('aria-describedby');
	});

	test('a submit the browser stops shows the email message', async () => {
		renderForgot();
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(email()).toHaveAttribute('aria-invalid', 'true');
	});

	test('once sent, the same card says so without saying whether the account exists', () => {
		renderForgot({ sent: true, email: 'cook@b.com' });
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toHaveTextContent('Check your email');
		// Focus moves to the new heading, so a screen reader hears the change.
		expect(heading).toHaveFocus();
		expect(
			screen.getByText('If cook@b.com has an account, a link to set a new password is on its way.')
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Send reset link' })).toBeNull();
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
	});

	test('"Send again" brings the form back with the address still in it, focused', async () => {
		renderForgot({ sent: true, email: 'cook@b.com' });
		expect(screen.getByText(/Didn't get it\?/)).toHaveTextContent("Didn't get it? Send again.");
		await fireEvent.click(screen.getByRole('link', { name: 'Send again' }));
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Forgot your password?');
		expect(email()).toHaveValue('cook@b.com');
		expect(email()).toHaveFocus();
		expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
	});
});
