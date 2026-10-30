import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
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

const email = () => screen.getByLabelText('Email') as HTMLInputElement;

// Runs the browser's check of the whole form, as a stopped submit does, and
// reports per field whether the page cancelled its invalid event, which keeps
// the browser's own bubble off the page.
async function validate(...fields: HTMLInputElement[]) {
	const cancelled = new Map<HTMLInputElement, boolean>();
	for (const field of fields)
		field.addEventListener('invalid', (e) => cancelled.set(field, e.defaultPrevented));
	fields[0].form!.reportValidity();
	await tick();
	return cancelled;
}

describe('Login page', () => {
	test('"Log in" everywhere: the subtitle and the button, under "Welcome back"', () => {
		renderLogin();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back');
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

	const EMAIL_RULE = 'Enter an email address like name@example.com';

	test('an email the browser rejects, once edited and left: the message is described and the field invalid', async () => {
		renderLogin();
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
		renderLogin();
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(email()).toHaveAttribute('aria-invalid', 'true');
	});

	// The message would push the button down between a tap's press and its
	// release, so the tap would land on nothing; the stopped submit shows it.
	test('an edited email left for the submit button shows no message until the browser stops the submit', async () => {
		renderLogin();
		const submit = screen.getByRole('button', { name: 'Log in' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: submit });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		expect(email()).not.toHaveAttribute('aria-invalid');
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(email()).toHaveAttribute('aria-invalid', 'true');
	});

	test('an edited email left for anywhere but the submit button shows the message', async () => {
		renderLogin();
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: document.body });
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	// Safari gives a tapped button no focus, so the blur names no target;
	// the press on the button, which comes first, holds the message back.
	test('an edited email left by a press on the submit button shows no message until the browser stops the submit', async () => {
		renderLogin();
		const submit = screen.getByRole('button', { name: 'Log in' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.pointerDown(submit);
		await fireEvent.blur(email(), { relatedTarget: null });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		await fireEvent.invalid(email());
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	test('a press on the submit button does not hold back a later leaving of the email', async () => {
		renderLogin();
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Log in' }));
		await fireEvent.focus(email());
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: null });
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
	});

	test("a stopped submit shows the page's email message instead of the browser's bubble, focus on the email", async () => {
		renderLogin();
		const password = screen.getByLabelText('Password') as HTMLInputElement;
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		const cancelled = await validate(email(), password);
		expect(cancelled.get(email())).toBe(true);
		// The empty password after it would otherwise take the bubble and the focus.
		expect(cancelled.get(password)).toBe(true);
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
		expect(document.activeElement).toBe(email());
	});

	test("with a valid email, an empty password keeps the browser's own report", async () => {
		renderLogin();
		const password = screen.getByLabelText('Password') as HTMLInputElement;
		await fireEvent.input(email(), { target: { value: 'jane@example.com' } });
		const cancelled = await validate(email(), password);
		expect(cancelled.has(email())).toBe(false);
		expect(cancelled.get(password)).toBe(false);
	});

	// A press dragged off the button, or Tab past it, submits nothing, so
	// nothing else would show the message the press held back.
	test('the submit button left without a submit shows the held-back email message', async () => {
		renderLogin();
		const submit = screen.getByRole('button', { name: 'Log in' });
		await fireEvent.input(email(), { target: { value: 'jane@' } });
		await fireEvent.blur(email(), { relatedTarget: submit });
		expect(screen.queryByText(EMAIL_RULE)).toBeNull();
		await fireEvent.blur(submit);
		expect(screen.getByText(EMAIL_RULE)).toBeInTheDocument();
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
