// The email field's own message on the auth pages (DESIGN.md, "Auth forms").

export const EMAIL_MESSAGE = 'Enter an email address like name@example.com';

type On<E extends Event> = E & { currentTarget: HTMLInputElement };

/**
 * A stopped submit fires invalid on every failing field in order, and the
 * browser bubbles over the first one not cancelled. A field with its own
 * message cancels and takes the focus only when it is that first one.
 */
export const firstInvalid = (field: HTMLInputElement) =>
	field.form?.querySelector(':invalid') === field;

/**
 * The email message shows once the user has typed in the field and left it,
 * or a submit was stopped, and follows the browser's own type="email" check,
 * so it clears as soon as the address is fixed. Spread `field` on the email
 * input and `button` on the submit button; render the message (id
 * "email-error") while `shown`.
 */
export function emailCheck() {
	let edited = $state(false);
	let left = $state(false);
	let valid = $state(true);
	const shown = $derived(left && !valid);
	// Set by a press on the submit button, which comes before the email's blur
	// in every browser; Safari gives the button no focus, so the blur names no
	// target. Cleared when the email gains focus, so a stray press holds back
	// nothing later. The button left without a submit (a press dragged off, or
	// Tab past it) shows what the press held back.
	let submitPressed = false;

	return {
		get shown() {
			return shown;
		},
		field: {
			get 'aria-invalid'() {
				return shown ? ('true' as const) : undefined;
			},
			get 'aria-describedby'() {
				return shown ? 'email-error' : undefined;
			},
			oninput(e: On<Event>) {
				edited = true;
				valid = e.currentTarget.validity.valid;
			},
			onfocus() {
				submitPressed = false;
			},
			onblur(e: On<FocusEvent>) {
				// Left for the submit button, the message waits for the stopped submit:
				// shown now, it would push the button from under the tap.
				const toSubmit =
					submitPressed ||
					e.relatedTarget === e.currentTarget.form?.querySelector('[type="submit"]');
				if (!toSubmit) left ||= edited;
			},
			oninvalid(e: On<Event>) {
				e.preventDefault();
				if (firstInvalid(e.currentTarget)) e.currentTarget.focus();
				left = true;
				valid = false;
			}
		},
		button: {
			onpointerdown() {
				submitPressed = true;
			},
			onblur() {
				left ||= edited;
			}
		}
	};
}
