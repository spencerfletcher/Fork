import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import SignupPage from './+page.svelte';
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MESSAGE, USERNAME_MIN } from '#lib/auth/rules.js';

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
const password = () => screen.getByLabelText('Password') as HTMLInputElement;

// Runs the browser's check of the whole form, as a stopped submit does, and
// reports per field whether the page cancelled its invalid event, which keeps
// the browser's own bubble off the page.
async function validate() {
	const fields = [email(), username(), password()];
	const cancelled = new Map<HTMLInputElement, boolean>();
	for (const field of fields)
		field.addEventListener('invalid', (e) => cancelled.set(field, e.defaultPrevented));
	fields[0].form!.reportValidity();
	await tick();
	return cancelled;
}

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
			`${USERNAME_MIN} to ${USERNAME_MAX} letters, digits, - or _. Your public handle, shown on every recipe.`
		);
	});

	test('the username prefills from the email prefix, sanitised to the rules', async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'Jane.Doe1987+fork@example.com' } });
		expect(username().value).toBe('janedoe1987fork');
		await fireEvent.input(email(), {
			target: { value: `${'a'.repeat(USERNAME_MAX + 10)}@example.com` }
		});
		expect(username().value).toBe('a'.repeat(USERNAME_MAX));
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
		expect(password).toHaveAttribute('minlength', String(PASSWORD_MIN));
		expect(password).not.toHaveAttribute('placeholder');
		expect(password).toHaveAccessibleDescription(`At least ${PASSWORD_MIN} characters`);
		expect(screen.getByText("We'll email you a link to confirm.")).toBeInTheDocument();
	});

	test('a username error renders under the field and marks it invalid', () => {
		renderSignup({ errors: { username: 'That username is taken' } });
		expect(username()).toHaveAttribute('aria-invalid', 'true');
		expect(username()).toHaveAccessibleDescription(/That username is taken/);
		expect(screen.getByText('That username is taken')).toHaveClass('field-error');
		expect(screen.queryByRole('alert')).toBeNull();
	});

	const RULE = USERNAME_MESSAGE;
	const HINT_RULES = `${USERNAME_MIN} to ${USERNAME_MAX} letters, digits, - or _.`;

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

	const EMAIL_RULE = 'Enter an email address like name@example.com';

	test('an email the browser rejects, once edited and left: the message is described and the field invalid', async () => {
		renderSignup();
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
		// Native validation stays underneath.
		expect(email()).toHaveAttribute('type', 'email');
		expect(email()).toBeRequired();
		// Fixed, it clears at once.
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		expect(email()).not.toHaveAttribute('aria-invalid');
		expect(email()).not.toHaveAttribute('aria-describedby');
	});

	test('a submit the browser stops shows the email message', async () => {
		renderSignup();
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(email()).toHaveAttribute('aria-invalid', 'true');
	});

	// The message would push the button down between a tap's press and its
	// release, so the tap would land on nothing; the stopped submit shows it.
	test('an edited email left for the submit button shows no message until the browser stops the submit', async () => {
		renderSignup();
		const submit = screen.getByRole('button', { name: 'Create account' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: submit });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		expect(email()).not.toHaveAttribute('aria-invalid');
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(email()).toHaveAttribute('aria-invalid', 'true');
	});

	test('an edited email left for anywhere but the submit button shows the message', async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: document.body });
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	// Safari gives a tapped button no focus, so the blur names no target;
	// the press on the button, which comes first, holds the message back.
	test('an edited email left by a press on the submit button shows no message until the browser stops the submit', async () => {
		renderSignup();
		const submit = screen.getByRole('button', { name: 'Create account' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.pointerDown(submit);
		await fireEvent.blur(email(), { relatedTarget: null });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	test('a press on the submit button does not hold back a later leaving of the email', async () => {
		renderSignup();
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Create account' }));
		await fireEvent.focus(email());
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: null });
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	test("a stopped submit shows the page's messages instead of the browser's bubbles, focus on the email", async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.input(username(), { target: { value: 'jo' } });
		const cancelled = await validate();
		expect(cancelled.get(email())).toBe(true);
		expect(cancelled.get(username())).toBe(true);
		expect(cancelled.get(password())).toBe(true);
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(screen.getByText(RULE)).toBeInTheDocument();
		expect(document.activeElement).toBe(email());
	});

	test("with a valid email, a stopped submit focuses the username and shows its rule, not the browser's bubble", async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		await fireEvent.input(username(), { target: { value: 'jo' } });
		const cancelled = await validate();
		expect(cancelled.has(email())).toBe(false);
		expect(cancelled.get(username())).toBe(true);
		// The empty password after it would otherwise take the bubble and the focus.
		expect(cancelled.get(password())).toBe(true);
		expect(screen.getByText(RULE)).toBeInTheDocument();
		expect(document.activeElement).toBe(username());
	});

	test("with a valid email and username, an empty password keeps the browser's own report", async () => {
		renderSignup();
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		const cancelled = await validate();
		expect(cancelled.has(username())).toBe(false);
		expect(cancelled.get(password())).toBe(false);
	});

	// A press dragged off the button, or Tab past it, submits nothing, so
	// nothing else would show the message the press held back.
	test('the submit button left without a submit shows the held-back email message', async () => {
		renderSignup();
		const submit = screen.getByRole('button', { name: 'Create account' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: submit });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		await fireEvent.blur(submit);
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
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

	test('"Create an account", and "Log in" as the switch, handing back a redirectTo', () => {
		renderSignup({ message: 'That email already has an account.', registered: true }, '/favorites');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create an account');
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
