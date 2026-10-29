import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import SignupPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

type Form = { message?: string; registered?: boolean; errors?: { username?: string } } | null;

function renderSignup(form: Form = null) {
	return render(SignupPage, { props: { form } as never });
}

const username = () => screen.getByLabelText('Username') as HTMLInputElement;
const email = () => screen.getByLabelText('Email') as HTMLInputElement;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Sign-up page', () => {
	test('the username field sits between Email and Password with the handle hint', () => {
		renderSignup();
		const inputs = screen.getAllByRole('textbox').map((el) => el.id);
		expect(inputs).toEqual(['email', 'username']);
		expect(username().compareDocumentPosition(screen.getByLabelText('Password'))).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(username()).toHaveAccessibleDescription('Your public handle, shown on every recipe.');
	});

	test('the username prefills from the email prefix, sanitised to the rules', async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'Jane.Doe1987+fork@example.com' } });
		expect(username().value).toBe('janedoe1987fork');
		await fireEvent.input(email(), { target: { value: `${'a'.repeat(40)}@example.com` } });
		expect(username().value).toBe('a'.repeat(30));
	});

	test('a username the user typed is not overwritten by the email', async () => {
		renderSignup();
		await fireEvent.input(username(), { target: { value: 'chef_jane' } });
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		expect(username().value).toBe('chef_jane');
	});

	test('the password rule and the confirmation note are visible text, not placeholders', () => {
		renderSignup();
		const password = screen.getByLabelText('Password');
		expect(password).toHaveAttribute('minlength', '6');
		expect(password).not.toHaveAttribute('placeholder');
		expect(password).toHaveAccessibleDescription('At least 6 characters');
		expect(screen.getByText("We'll email you a link to confirm.")).toBeInTheDocument();
	});

	test('a username error renders under the field and marks it invalid', () => {
		renderSignup({ errors: { username: 'That username is taken' } });
		expect(username()).toHaveAttribute('aria-invalid', 'true');
		expect(username()).toHaveAccessibleDescription(/That username is taken/);
		expect(screen.getByText('That username is taken')).toHaveClass('field-error');
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('a Supabase failure is announced in the alert block', () => {
		renderSignup({ message: 'Could not create the account. Try again.' });
		expect(screen.getByRole('alert')).toHaveTextContent('Could not create the account. Try again.');
	});

	test('an already registered email offers Sign in inline', () => {
		renderSignup({ message: 'That email already has an account.', registered: true });
		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent('That email already has an account.');
		expect(within(alert).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
	});
});
