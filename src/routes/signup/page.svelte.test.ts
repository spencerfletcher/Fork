import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import SignupPage from './+page.svelte';

// The enhance mock keeps the page's submit callback so a test can start a
// submission without a server.
const { submits } = vi.hoisted(() => ({ submits: [] as Array<() => unknown> }));
vi.mock('$app/forms', () => ({
	enhance: (_form: HTMLFormElement, submit: () => unknown) => {
		submits.push(submit);
		return { destroy: () => {} };
	}
}));

type Form = { message?: string; registered?: boolean; errors?: { username?: string } } | null;

function renderSignup(form: Form = null, redirectTo: string | null = null) {
	return render(SignupPage, { props: { form, data: { redirectTo } } as never });
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
		// The rules up front, on one line (decided 29 October 2026).
		expect(username()).toHaveAccessibleDescription(
			'3 to 30 letters, digits, - or _. Your public handle, shown on every recipe.'
		);
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

	const RULE = 'Usernames are 3 to 30 characters: letters, digits, - or _';
	const HINT_RULES = '3 to 30 letters, digits, - or _.';

	test('a username the browser rejects, once the user leaves it: the rule line is described, the field invalid, the rule printed once', async () => {
		renderSignup();
		await fireEvent.input(username(), { target: { value: 'Jane Doe' } });
		// Not while typing the first time: only once the user has left the field.
		expect(screen.queryByText(RULE)).toBeNull();
		expect(username()).not.toHaveAttribute('aria-invalid');
		await fireEvent.blur(username());
		const rule = screen.getByText(RULE);
		expect(rule).toHaveClass('field-error');
		expect(username()).toHaveAttribute('aria-invalid', 'true');
		expect(username()).toHaveAccessibleDescription(
			`${RULE} Your public handle, shown on every recipe.`
		);
		expect(screen.queryByText(HINT_RULES, { exact: false })).toBeNull();
		// Fixed, it clears at once, and the hint has its rules back.
		await fireEvent.input(username(), { target: { value: 'jane_doe' } });
		expect(screen.queryByText(RULE)).toBeNull();
		expect(username()).not.toHaveAttribute('aria-invalid');
		expect(username()).toHaveAccessibleDescription(
			`${HINT_RULES} Your public handle, shown on every recipe.`
		);
	});

	test('a username left empty and then prefilled from the email clears its rule line', async () => {
		renderSignup();
		await fireEvent.blur(username());
		expect(screen.getByText(RULE)).toBeInTheDocument();
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		expect(screen.queryByText(RULE)).toBeNull();
		expect(username()).not.toHaveAttribute('aria-invalid');
	});

	test('a submit the browser stops marks the username as left, so its rule line shows', async () => {
		renderSignup();
		await fireEvent.input(username(), { target: { value: 'jo' } });
		await fireEvent.invalid(username());
		expect(screen.getByText(RULE)).toBeInTheDocument();
		expect(username()).toHaveAttribute('aria-invalid', 'true');
	});

	test('a Supabase failure is announced in the alert block', () => {
		renderSignup({ message: 'Could not create the account. Try again.' });
		expect(screen.getByRole('alert')).toHaveTextContent('Could not create the account. Try again.');
	});

	test('an already registered email offers Log in inline', () => {
		renderSignup({ message: 'That email already has an account.', registered: true });
		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent('That email already has an account.');
		expect(within(alert).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
	});

	test('"Create an Account", and "Log in" as the switch, handing back a redirectTo', () => {
		renderSignup({ message: 'That email already has an account.', registered: true }, '/favorites');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create an Account');
		for (const link of screen.getAllByRole('link', { name: 'Log in' })) {
			expect(link).toHaveAttribute('href', '/login?redirectTo=%2Ffavorites');
		}
		expect(screen.queryByText(/sign in/i)).toBeNull();
	});

	test('the username states its rules as a pattern that browsers can compile, and every field has its autocomplete token', () => {
		renderSignup();
		// Browsers compile the pattern attribute with the regex v flag, under which an
		// unescaped hyphen inside a character class is a syntax error and the whole
		// pattern is silently dropped.
		const pattern = new RegExp(`^(?:${username().getAttribute('pattern')})$`, 'v');
		expect(pattern.test('jane_doe-1')).toBe(true);
		expect(pattern.test('Jane Doe')).toBe(false);
		expect(pattern.test('jo')).toBe(false);
		expect(username()).toHaveAttribute('autocomplete', 'username');
		expect(email()).toHaveAttribute('autocomplete', 'email');
		expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
	});

	test('while the form is submitting the button is disabled and says so', async () => {
		submits.length = 0;
		renderSignup();
		submits.at(-1)!();
		await tick();
		expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled();
	});
});
