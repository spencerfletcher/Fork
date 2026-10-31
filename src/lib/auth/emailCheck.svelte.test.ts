import { describe, test, expect, beforeEach } from 'vitest';
import { flushSync } from 'svelte';
import { emailCheck, firstInvalid } from './emailCheck.svelte.js';

// A form as the auth pages have it: the email, a later required field, and
// the submit button. Handlers are called as the browser would fire them.
let form: HTMLFormElement;
let email: HTMLInputElement;
let other: HTMLInputElement;
let submit: HTMLButtonElement;

beforeEach(() => {
	document.body.innerHTML = `<form>
		<input id="email" type="email" required>
		<input id="other" required>
		<button type="submit">Go</button>
	</form>`;
	form = document.querySelector('form')!;
	email = document.querySelector('#email')!;
	other = document.querySelector('#other')!;
	submit = document.querySelector('button')!;
});

const on = <E extends Event>(event: E, target: Element, init: Record<string, unknown> = {}) => {
	for (const [key, value] of Object.entries({ currentTarget: target, ...init }))
		Object.defineProperty(event, key, { value });
	return event as never;
};
const type = (check: ReturnType<typeof emailCheck>, value: string) => {
	email.value = value;
	check.field.oninput(on(new Event('input'), email));
};
const blur = (check: ReturnType<typeof emailCheck>, relatedTarget: Element | null = null) =>
	check.field.onblur(on(new FocusEvent('blur'), email, { relatedTarget }));
const shown = (check: ReturnType<typeof emailCheck>) => {
	flushSync();
	return check.shown;
};

describe('emailCheck', () => {
	test('a bad address typed and left shows the message and marks the field', () => {
		const check = emailCheck();
		type(check, 'jane@');
		blur(check);
		expect(shown(check)).toBe(true);
		expect(check.field['aria-invalid']).toBe('true');
		expect(check.field['aria-describedby']).toBe('email-error');
	});

	test('passing through without typing shows nothing', () => {
		const check = emailCheck();
		blur(check);
		expect(shown(check)).toBe(false);
		expect(check.field['aria-invalid']).toBeUndefined();
		expect(check.field['aria-describedby']).toBeUndefined();
	});

	test('fixing the address clears the message', () => {
		const check = emailCheck();
		type(check, 'jane@');
		blur(check);
		type(check, 'jane@example.com');
		expect(shown(check)).toBe(false);
	});

	test('leaving for the submit button by focus holds the message back until the button is left', () => {
		const check = emailCheck();
		type(check, 'jane@');
		blur(check, submit);
		expect(shown(check)).toBe(false);
		check.button.onblur();
		expect(shown(check)).toBe(true);
	});

	test('a press on the button holds it back too, even when the blur names no target', () => {
		const check = emailCheck();
		type(check, 'jane@');
		check.button.onpointerdown();
		blur(check);
		expect(shown(check)).toBe(false);
	});

	test('focusing the email again forgets an earlier press', () => {
		const check = emailCheck();
		check.button.onpointerdown();
		check.field.onfocus();
		type(check, 'jane@');
		blur(check);
		expect(shown(check)).toBe(true);
	});

	test('the button left without typing anything shows nothing', () => {
		const check = emailCheck();
		check.button.onblur();
		expect(shown(check)).toBe(false);
	});

	test('a stopped submit cancels the bubble, shows the message and focuses the field when it is first', () => {
		const check = emailCheck();
		const invalid = new Event('invalid', { cancelable: true });
		check.field.oninvalid(on(invalid, email));
		expect(invalid.defaultPrevented).toBe(true);
		expect(shown(check)).toBe(true);
		expect(document.activeElement).toBe(email);
	});

	test('a stopped submit leaves focus alone when an earlier field is invalid', () => {
		form.prepend(Object.assign(document.createElement('input'), { required: true }));
		const check = emailCheck();
		check.field.oninvalid(on(new Event('invalid', { cancelable: true }), email));
		expect(shown(check)).toBe(true);
		expect(document.activeElement).not.toBe(email);
	});
});

describe('firstInvalid', () => {
	test('is true only for the first invalid field of its form', () => {
		expect(firstInvalid(email)).toBe(true);
		expect(firstInvalid(other)).toBe(false);
		email.value = 'jane@example.com';
		expect(firstInvalid(other)).toBe(true);
	});
});
