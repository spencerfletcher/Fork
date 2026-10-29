import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ResetPasswordPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const renderReset = (linkValid: boolean, form: { message?: string } | null = null) =>
	render(ResetPasswordPage, { props: { form, data: { linkValid } } as never });

describe('Reset password page', () => {
	test("a valid link offers a new password with the sign-up's hint and minimum", () => {
		renderReset(true);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Reset password');
		const password = screen.getByLabelText('New password');
		expect(password).toHaveAttribute('type', 'password');
		expect(password).toHaveAttribute('autocomplete', 'new-password');
		expect(password).toHaveAttribute('minlength', '6');
		expect(password).toHaveAccessibleDescription('At least 6 characters');
		expect(screen.getByRole('button', { name: 'Set password' })).toBeInTheDocument();
	});

	test('a failure shows in the alert above the form', () => {
		renderReset(true, { message: "That's your current password. Choose a new one." });
		expect(screen.getByRole('alert')).toHaveTextContent(
			"That's your current password. Choose a new one."
		);
	});

	test('an expired link says so and leads to a new one, with no form', () => {
		renderReset(false);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Link expired');
		expect(screen.queryByLabelText('New password')).toBeNull();
		expect(screen.getByRole('link', { name: 'Send a new link' })).toHaveAttribute(
			'href',
			'/forgot-password'
		);
	});
});
