import {
	fieldOfMessage,
	numberMessages,
	readSourceUrl,
	textCapError,
	timeMessages,
	CAP_MESSAGES,
	NUMBER_FIELDS,
	REQUIRED_MESSAGES,
	TIME_FIELDS,
	type NumberField,
	type RecipeDraft,
	type TimeField
} from '#lib/recipes/validation.js';
import { readDuration } from '#lib/recipes/times.js';

// What a typed field the browser cannot judge says, in the server's own
// wording; '' when it is fine. Set as the box's custom validity, so a save
// with one wrong is blocked like any other invalid field. `before` is what the
// box started with: a long value the cook has not changed passes, as it does
// on the server.
export function typedMessage(name: string, value: string, before?: string): string {
	if (name === 'title' || name === 'description' || name === 'commitMessage')
		return textCapError(name, value, before) ?? '';
	if (name in TIME_FIELDS) {
		const read = readDuration(value);
		return read.ok ? '' : timeMessages(name as TimeField)[read.reason];
	}
	if (name === 'sourceUrl') {
		const read = readSourceUrl(value);
		return read.ok ? '' : read.error;
	}
	return '';
}

function validityMessage(name: string, v: ValidityState, boxMessages: BoxMessages): string {
	if (name in boxMessages && (v.valueMissing || v.typeMismatch)) return boxMessages[name];
	// A custom message is typedMessage's, read from the value: the validity
	// lags the keystroke being checked.
	if (v.valid || v.customError) return '';
	// Not whole before below the floor, in the server's order, so -1.5 says the same in both.
	const messages = numberMessages(name as NumberField);
	return v.rangeUnderflow && !v.stepMismatch ? messages.belowMin : messages.whole;
}

/** What a box the browser holds empty or mistyped says, by field name. */
type BoxMessages = Readonly<Record<string, string>>;

/** Focuses a field, first opening the fold it sits in (the phone editor's
 *  details), so a blocked or refused save lands in it in one action. */
export function focusField(el: HTMLElement | null) {
	const fold = el?.closest('details');
	if (fold) fold.open = true;
	el?.focus();
}

/**
 * A form's inline errors (the recipe editor's, the Journal entry's), one per
 * field name, in the server's own wording. A field is checked when it is left
 * after an edit, when it blocks a submit, and on every keystroke once it
 * carries an error, so the message and
 * the browser's :user-invalid state come from the same validity and clear
 * together. Passing through an untouched field says nothing, as the auth
 * pages do. A server-rendered reply shows a field's message too, as the draft
 * is shown: `form` seeds the initial state, since no effect runs there.
 * `before` is what the capped boxes started with, for typedMessage.
 * `boxMessages` is what an empty or mistyped box says: the editor's required
 * fields by default; the Journal's entry form passes its own.
 */
export function fieldErrors(
	form: { error: string } | null,
	before?: Pick<RecipeDraft, 'title' | 'description'>,
	boxMessages: BoxMessages = REQUIRED_MESSAGES
) {
	const serverField = form ? fieldOfMessage(form.error) : undefined;
	const errors = $state<Record<string, string>>(
		form && serverField ? { [serverField]: form.error } : {}
	);
	// Read only by handlers, so not state.
	const edited: Record<string, boolean> = {};
	// A blocked submit makes the outcome line count what still needs fixing.
	let blocked = $state(false);
	const count = $derived(Object.values(errors).filter(Boolean).length);

	function validate(target: EventTarget | null) {
		const el = target as HTMLInputElement | HTMLTextAreaElement;
		const name = el?.name;
		if (!name) return;
		const started = name === 'title' || name === 'description' ? before?.[name] : undefined;
		const typed = typedMessage(name, el.value, started);
		if (typed || name in TIME_FIELDS || name === 'sourceUrl' || name in CAP_MESSAGES)
			errors[name] = typed;
		if (!typed && (name in boxMessages || name in NUMBER_FIELDS))
			errors[name] = validityMessage(name, el.validity, boxMessages);
	}

	return {
		errors,
		get blocked() {
			return blocked;
		},
		get count() {
			return count;
		},
		onfocusout(e: FocusEvent) {
			if (edited[(e.target as HTMLInputElement).name]) validate(e.target);
		},
		oninput(e: Event) {
			const name = (e.target as HTMLInputElement).name;
			edited[name] = true;
			if (errors[name]) validate(e.target);
		},
		// A blocked submit fires invalid on each bad field in order. The inline
		// message says it, so the browser's bubble, which would say it again, is
		// cancelled; cancelling also stops the browser focusing the field, so the
		// first invalid one is focused here.
		onInvalid(event: Event & { currentTarget: HTMLFormElement }) {
			event.preventDefault();
			blocked = true;
			validate(event.target);
			// Read from validity, not :invalid, which jsdom misses on a box with maxlength.
			const bad = [...event.currentTarget.elements].find(
				(el): el is HTMLInputElement | HTMLTextAreaElement =>
					(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
					!el.validity.valid
			);
			// A text box's textarea is hidden behind its live box, which has taken its id.
			focusField(bad?.hidden ? document.getElementById(bad.name) : (bad ?? null));
		},
		aria: (name: string) =>
			errors[name] ? { 'aria-invalid': 'true' as const, 'aria-describedby': `${name}-error` } : {}
	};
}
