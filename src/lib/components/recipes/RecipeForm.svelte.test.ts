import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import source from './RecipeForm.svelte?raw';
import barSource from './SaveBar.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import RecipeForm from './RecipeForm.svelte';
import {
	draftOf,
	PHOTO_TYPES,
	PHOTO_MAX_BYTES,
	PHOTO_SIZE_MESSAGE,
	emptyGroupMessage,
	timeMessages,
	CAPS,
	CAP_MESSAGES,
	type Visibility
} from '#lib/recipes/validation.js';
import { AUDIENCE_LABEL } from '#lib/audience.js';
import { chooseOption, chosenValue } from '#lib/testing/choices.js';
import { MAKES_TOO_LONG, MAX_MAKES } from '#lib/recipes/limits.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: () => {} }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// jsdom has no layout or scrolling: the rects are set by hand and the scroll recorded.
const scrollIntoView = vi.fn();
const reduced = { matches: false };

// jsdom applies no component CSS, so the declarations are read from the source.
const style = source.slice(source.indexOf('<style>'));

describe('RecipeForm photo input', () => {
	test('offers the types a save stores', () => {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		expect(document.querySelector('input[type="file"]')).toHaveAttribute(
			'accept',
			PHOTO_TYPES.join(',')
		);
	});
});

describe('RecipeForm photo over the size cap', () => {
	// The host refuses a big request before the action runs, so the check is here too.
	test('says so under the field, marks the input invalid and clears it, so nothing is sent', async () => {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
		const pick = (bytes: number) =>
			fireEvent.change(input, {
				target: { files: [new File([new Uint8Array(bytes)], 'a.jpg', { type: PHOTO_TYPES[0] })] }
			});
		const clear = vi.spyOn(input, 'value', 'set');
		await pick(PHOTO_MAX_BYTES + 1);
		const error = screen.getByText(PHOTO_SIZE_MESSAGE);
		expect(error).toHaveClass('field-error');
		expect(error).toHaveAttribute('role', 'alert');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input.getAttribute('aria-describedby')).toBe(error.id);
		expect(clear).toHaveBeenCalledWith('');
		expect(input).toHaveAccessibleName('Add photo');
		await pick(PHOTO_MAX_BYTES);
		expect(screen.queryByText(PHOTO_SIZE_MESSAGE)).toBeNull();
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(screen.getByLabelText('Replace photo')).toBe(input);
	});
});

describe('RecipeForm photo removed on a new recipe', () => {
	// The pills give way to the compact row: focus lands on its Undo, not the page.
	test('focus moves to Undo', async () => {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
		const file = new File(['x'], 'a.png', { type: PHOTO_TYPES[1] });
		await fireEvent.change(input, { target: { files: [file] } });
		const remove = await screen.findByRole('button', { name: 'Remove photo' });
		remove.focus();
		await fireEvent.click(remove);
		await tick();
		expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Undo photo removal' })).toHaveFocus();
	});
});

describe('RecipeForm save error that names no field', () => {
	// The fieldset was disabled while saving, so focus fell to the page.
	test('focus goes to the submit button beside the alert', async () => {
		const baseline = draftOf(new FormData());
		render(RecipeForm, {
			props: {
				baseline,
				form: { error: 'Could not save the recipe. Try again.', draft: baseline },
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent('Could not save the recipe. Try again.');
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Create recipe' }));
	});
});

describe('RecipeForm field focused under the phone bar', () => {
	beforeEach(() => {
		scrollIntoView.mockClear();
		Element.prototype.scrollIntoView = scrollIntoView;
		reduced.matches = false;
		window.matchMedia = ((query: string) => ({
			matches: query.includes('reduce') && reduced.matches
		})) as never;
	});

	// The box itself always clears the bar here; only its block (label, box,
	// hint) reaches under it, so a scroll of the box alone would not count.
	function setup(fieldBottom: number, barTop: number) {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const box = screen.getByRole('textbox', { name: /^ingredients/i });
		const bar = screen.getByRole('button', { name: 'Create recipe' }).closest('.actions-bar')!;
		box.getBoundingClientRect = () => ({ bottom: barTop - 40 }) as DOMRect;
		fieldOf(box).getBoundingClientRect = () => ({ bottom: fieldBottom }) as DOMRect;
		bar.getBoundingClientRect = () => ({ top: barTop }) as DOMRect;
		return box;
	}

	const fieldOf = (box: HTMLElement) => box.closest('.field')!;

	test('scrolls a field whose hint is hidden by the bar to the nearest edge, box and hint together', () => {
		setup(1000, 780).focus();
		expect(scrollIntoView).toHaveBeenCalledTimes(1);
		const field = fieldOf(screen.getByRole('textbox', { name: /^ingredients/i }));
		expect(field).toContainElement(screen.getByText(/^One per line/));
		expect(scrollIntoView.mock.contexts[0]).toBe(field);
		expect(scrollIntoView.mock.calls[0][0]).toEqual({ block: 'nearest', behavior: 'smooth' });
	});

	test('jumps without animation under reduced motion', () => {
		reduced.matches = true;
		setup(1000, 780).focus();
		expect(scrollIntoView.mock.calls[0][0]).toEqual({ block: 'nearest', behavior: 'instant' });
	});

	test('leaves a field clear of the bar where it is', () => {
		setup(780, 780).focus();
		expect(scrollIntoView).not.toHaveBeenCalled();
	});

	test("leaves the bar's own buttons where they are", () => {
		setup(0, 780);
		screen.getByRole('button', { name: 'Create recipe' }).getBoundingClientRect = () =>
			({ bottom: 830 }) as DOMRect;
		screen.getByRole('button', { name: 'Create recipe' }).focus();
		expect(scrollIntoView).not.toHaveBeenCalled();
	});
});

describe('RecipeForm title box', () => {
	const renderForm = () =>
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});

	// A long title wraps on a phone instead of scrolling out of a 352px box.
	test('is a one-row textarea named title, required', () => {
		renderForm();
		const title = screen.getByRole('textbox', { name: 'Title' });
		expect(title.tagName).toBe('TEXTAREA');
		expect(title).toHaveAttribute('name', 'title');
		expect(title).toHaveAttribute('rows', '1');
		expect(title).toBeRequired();
	});

	test('Enter cannot type a newline', () => {
		renderForm();
		const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });
		screen.getByRole('textbox', { name: 'Title' }).dispatchEvent(enter);
		expect(enter.defaultPrevented).toBe(true);
	});

	test('a pasted newline is flattened to a space', async () => {
		renderForm();
		const title = screen.getByRole('textbox', { name: 'Title' });
		await fireEvent.input(title, { target: { value: 'Brown butter\ncookies\r\n' } });
		expect(title).toHaveValue('Brown butter cookies ');
	});

	// field-sizing grows it; without it, rows="1" and this floor keep the input's height.
	test("keeps the single-line boxes' height where field-sizing is unsupported, and no resize grip", () => {
		const rule = cssRule(style, "textarea[name='title']");
		expect(rule).toMatch(/min-height:\s*calc\(1lh \+ 20px\)/);
		expect(rule).toMatch(/resize:\s*none/);
	});
});

describe('RecipeForm commit message left blank', () => {
	function renderEdit() {
		const loaded = new FormData();
		loaded.set('title', 'Cookies');
		loaded.set('ingredients', '1 cup flour');
		loaded.set('steps', 'Mix.');
		render(RecipeForm, {
			props: {
				baseline: draftOf(loaded),
				form: null,
				allTags: [],
				submitLabel: 'Save',
				cancelHref: '/recipes/cookies',
				nextVersion: 2
			}
		});
		return screen.getByLabelText(/what changed/i);
	}

	// The placeholder is what the save writes; the hint says so in words.
	test('says the placeholder is saved, under the box, until the cook types', async () => {
		const message = renderEdit();
		await fireEvent.input(document.querySelector('textarea[name="steps"]')!, {
			target: { value: 'Mix well.' }
		});
		const placeholder = message.getAttribute('placeholder');
		const hint = screen.getByText(`Left blank, saves as: ${placeholder}`);
		expect(hint).toHaveClass('form-hint');
		expect(message).toHaveAccessibleDescription(hint.textContent!);
		await fireEvent.input(message, { target: { value: 'Stirred longer' } });
		expect(screen.queryByText(/^Left blank/)).not.toBeInTheDocument();
	});

	test('the message is named What changed?, with no optional mark', () => {
		expect(renderEdit()).toHaveAccessibleName('What changed?');
	});

	// The generic prompt is never saved: nothing changed, so no version is written.
	test('says nothing while there is no change to describe', () => {
		renderEdit();
		expect(screen.queryByText(/^Left blank/)).not.toBeInTheDocument();
	});
});

describe('RecipeForm Makes', () => {
	const props = (fields: Record<string, string>, error?: string) => {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) fd.append(k, v);
		const baseline = draftOf(fd);
		return {
			baseline,
			form: error ? { error, draft: baseline } : null,
			allTags: [],
			submitLabel: 'Save',
			cancelHref: '/recipes'
		};
	};

	test('an optional text field after the numbers, filled from the draft, with its hint', () => {
		render(RecipeForm, { props: props({ makes: '12 buns' }) });
		const input = screen.getByLabelText(/^Makes/) as HTMLInputElement;
		expect(input).toHaveAttribute('type', 'text');
		expect(input).toHaveAttribute('name', 'makes');
		expect(input).toHaveAttribute('maxlength', String(MAX_MAKES));
		expect(input).not.toBeRequired();
		expect(input.value).toBe('12 buns');
		expect(input).toHaveAccessibleDescription("What one batch produces, when that isn't portions.");
		const serves = screen.getByLabelText('Serves');
		expect(serves.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test("the server's Makes message sits under the field", async () => {
		render(RecipeForm, { props: props({ makes: 'x' }, MAKES_TOO_LONG) });
		await tick();
		const input = screen.getByLabelText(/^Makes/);
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription(
			`${MAKES_TOO_LONG} What one batch produces, when that isn't portions.`
		);
	});

	test("an empty group's message sits under the ingredients box", async () => {
		const message = emptyGroupMessage('Filling', 'ingredients');
		render(RecipeForm, { props: props({ ingredients: '# Filling' }, message) });
		await tick();
		expect(screen.getByRole('textbox', { name: /^Ingredients/ })).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect(screen.getByRole('alert')).toHaveTextContent(message);
	});
});

describe('RecipeForm audience', () => {
	const renderWith = (visibility: Visibility, extra: Record<string, unknown> = {}) => {
		const loaded = new FormData();
		loaded.set('title', 'Cookies');
		loaded.set('ingredients', '1 cup flour');
		loaded.set('steps', 'Mix.');
		render(RecipeForm, {
			props: {
				baseline: { ...draftOf(loaded), visibility },
				form: null,
				allTags: [],
				submitLabel: 'Save',
				cancelHref: '/recipes/cookies',
				nextVersion: 2,
				...extra
			}
		});
	};

	const AUDIENCE = 'Who can see this recipe';

	test('the stored audience is the chosen one, submitted as visibility, and a choice moves it', async () => {
		renderWith('friends');
		expect(screen.getByRole('combobox', { name: AUDIENCE })).toHaveTextContent(
			AUDIENCE_LABEL.friends
		);
		expect(chosenValue('visibility')).toBe('friends');
		await chooseOption(AUDIENCE, AUDIENCE_LABEL.public);
		expect(chosenValue('visibility')).toBe('public');
	});

	test('a private draft shows Only me by default', () => {
		renderWith('private');
		expect(chosenValue('visibility')).toBe('private');
	});

	test('with forks, the hint describes the box', () => {
		renderWith('public', { hasForks: true });
		expect(screen.getByRole('combobox', { name: AUDIENCE })).toHaveAccessibleDescription(
			"Making this more private doesn't hide existing forks."
		);
	});

	test('without forks there is no hint', () => {
		renderWith('public');
		expect(screen.queryByText(/existing forks/)).toBeNull();
	});
});

describe('RecipeForm phone details', () => {
	const renderWith = (fields: Record<string, string>, error?: string) => {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) fd.append(k, v);
		const baseline = draftOf(fd);
		render(RecipeForm, {
			props: {
				baseline,
				form: error ? { error, draft: baseline } : null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
	};
	const fold = () => document.querySelector('details') as HTMLDetailsElement;
	const summary = () => fold().querySelector('summary')!;

	test('folds the facts between the description and Ingredients, closed on a phone', () => {
		renderWith({});
		expect(fold().open).toBe(false);
		expect(fold()).toContainElement(screen.getByLabelText('Serves'));
		expect(fold()).toContainElement(screen.getByLabelText('Rest'));
		const description = screen.getByLabelText('Description');
		const ingredients = screen.getByRole('textbox', { name: /^Ingredients/ });
		expect(
			description.compareDocumentPosition(fold()) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		expect(
			fold().compareDocumentPosition(ingredients) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('empty, the summary names the audience and offers Add details', () => {
		renderWith({ visibility: 'friends' });
		expect(summary()).toHaveTextContent(`${AUDIENCE_LABEL.friends}`);
		expect(summary()).toHaveTextContent(/Add details$/);
	});

	test('filled, the summary reads the yield as entered and the audience, and offers Edit details', () => {
		renderWith({ makes: '36 cookies', visibility: 'public' });
		expect(summary()).toHaveTextContent(`Makes 36 cookies${AUDIENCE_LABEL.public}`);
		expect(summary()).toHaveTextContent(/Edit details$/);
	});

	// The house dots, drawn and unread; each sits in the gap before its fact,
	// so the one before a fact that wraps is clipped with the box's overflow.
	test('the facts are separated by drawn dots, and no wrapped line starts with one', () => {
		renderWith({ makes: '36 cookies', visibility: 'public' });
		// The dots are app.css's .dot-clip, centred in the gap and clipped at the left.
		expect(summary().querySelector('.fold-facts')).toHaveClass('dot-list', 'dot-clip');
		expect(cssRule(style, '.fold-facts')).toMatch(/overflow:\s*hidden/);
		expect(cssRule(style, '.fold-facts')).toMatch(/--dot-gap:\s*14px/);
	});

	test('on a phone the folded summary sits one section gap, the form’s own, above Ingredients', () => {
		const phone = style.slice(style.lastIndexOf('@media (max-width: 699px)'));
		expect(cssRule(phone, '.editor-top')).toMatch(/margin-bottom:\s*0/);
	});

	test('a save blocked by a bad Rest time opens the details and focuses Rest in one action', () => {
		renderWith({
			title: 'Cookies',
			ingredients: '1 cup flour',
			steps: 'Mix.',
			restTimeMinutes: 'a while'
		});
		const rest = screen.getByLabelText('Rest');
		rest.dispatchEvent(new Event('invalid', { cancelable: true }));
		expect(fold().open).toBe(true);
		expect(rest).toHaveFocus();
	});

	test('a server refusal for a field in the details opens them and focuses it', async () => {
		const message = timeMessages('restTimeMinutes').unreadable;
		renderWith({ restTimeMinutes: 'a while' }, message);
		await tick();
		await tick();
		expect(fold().open).toBe(true);
		expect(screen.getByLabelText('Rest')).toHaveFocus();
	});
});

describe('RecipeForm save bar', () => {
	test('a new recipe has Save and Cancel in the bar, and no What changed?', () => {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const bar = screen.getByRole('button', { name: 'Create recipe' }).closest('.save-bar');
		expect(bar).toContainElement(screen.getByRole('link', { name: 'Cancel' }));
		expect(screen.queryByLabelText(/what changed/i)).toBeNull();
		// Off a Mac (jsdom has no platform), the save key's hint says Ctrl.
		expect(bar).toHaveTextContent(/Ctrl Enter$/);
	});

	test('the bar is pinned to the bottom on every size, and the page keeps a focused field above it', () => {
		const barStyle = barSource.slice(barSource.indexOf('<style>'));
		expect(cssRule(barStyle, '.save-bar')).toMatch(/position:\s*sticky/);
		expect(cssRule(barStyle, ':global(html:has(.save-bar))')).toMatch(
			/scroll-padding-bottom:[^;]*env\(safe-area-inset-bottom\)/
		);
	});

	// A border image's outset paints past the box without adding to the page's scroll width.
	test("the bar's fill and rule run to the window's edges at every width, its contents on the column", () => {
		const barStyle = barSource.slice(barSource.indexOf('<style>'));
		const bar = cssRule(barStyle, '.save-bar');
		expect(bar).toMatch(
			/border-image:\s*linear-gradient\(var\(--color-border\) 0 1px, var\(--color-surface\) 0\) 0 fill \/ 0 \/\s*0\s+100vw/
		);
		expect(bar).toMatch(/margin-inline:\s*-24px[\s\S]*padding:\s*8px 24px/);
	});
});

describe('RecipeForm blocked on a text box', () => {
	// The browser fires invalid on the hidden textarea; focus goes to the box a person types in.
	test('focuses the live box when the ingredients are the first invalid field', async () => {
		const loaded = new FormData();
		loaded.set('title', 'Cookies');
		render(RecipeForm, {
			props: {
				baseline: draftOf(loaded),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const field = document.querySelector('textarea[name="ingredients"]')!;
		field.dispatchEvent(new Event('invalid', { cancelable: true }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'Ingredients' });
		expect(box).toHaveFocus();
		expect(box).toHaveAccessibleDescription(/^At least one ingredient is required/);
	});
});

describe('RecipeForm length caps', () => {
	const chars = (n: number, c = 'a') => c.repeat(n);
	const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const renderWith = (fields: Record<string, string | string[]> = {}, error?: string) => {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) for (const one of [v].flat()) fd.append(k, one);
		const baseline = draftOf(fd);
		render(RecipeForm, {
			props: {
				baseline,
				form: error ? { error, draft: baseline } : null,
				allTags: [],
				submitLabel: 'Save',
				cancelHref: '/recipes',
				nextVersion: 2
			}
		});
	};
	const type = async (el: HTMLElement, value: string) => {
		await fireEvent.input(el, { target: { value } });
		await fireEvent.focusOut(el);
	};

	for (const [field, label] of [
		['title', /^Title/],
		['description', 'Description'],
		['commitMessage', 'What changed?']
	] as const) {
		test(`${field}: too long says so under the box on leaving it, counting characters after trimming`, async () => {
			renderWith();
			const box = screen.getByLabelText(label);
			// An emoji is one character, as the server counts; spaces round it are trimmed.
			await type(box, `  ${chars(CAPS[field], '🍅')}  `);
			expect(box).not.toHaveAttribute('aria-invalid');
			await type(box, chars(CAPS[field] + 1));
			expect(box).toHaveAttribute('aria-invalid', 'true');
			expect(box).toHaveAccessibleDescription(new RegExp(`^${escape(CAP_MESSAGES[field])}`));
			// Once flagged, each keystroke checks again.
			await fireEvent.input(box, { target: { value: chars(CAPS[field]) } });
			expect(box).not.toHaveAttribute('aria-invalid');
			// No maxlength: a pasted long text is never cut short.
			expect(box).not.toHaveAttribute('maxlength');
		});

		test(`${field}: a blocked save says so and focuses the box`, async () => {
			renderWith({ title: 'Cookies', ingredients: '1 cup flour', steps: 'Mix.' });
			const box = screen.getByLabelText(label) as HTMLInputElement;
			await fireEvent.input(box, { target: { value: chars(CAPS[field] + 1) } });
			await tick();
			expect(box.validity.customError).toBe(true);
			box.dispatchEvent(new Event('invalid', { cancelable: true }));
			await tick();
			expect(box).toHaveFocus();
			expect(screen.getByText(CAP_MESSAGES[field])).toHaveClass('field-error');
		});

		test(`${field}: the server's refusal shows under the box and focuses it, not as the form's error`, async () => {
			renderWith({ title: 'Cookies' }, CAP_MESSAGES[field]);
			await tick();
			await tick();
			const box = screen.getByLabelText(label);
			expect(box).toHaveFocus();
			expect(box).toHaveAccessibleDescription(new RegExp(`^${escape(CAP_MESSAGES[field])}`));
			expect(document.querySelector('.form-error')).toBeNull();
		});
	}

	// The server lets a value the recipe already has through; so does the box.
	test('an existing over-cap title or description the cook has not changed is not flagged', async () => {
		const long = { title: chars(CAPS.title + 5), description: chars(CAPS.description + 5) };
		renderWith(long);
		for (const [name, label] of [
			['title', /^Title/],
			['description', 'Description']
		] as const) {
			const box = screen.getByLabelText(label) as HTMLInputElement;
			await type(box, `${long[name]} `);
			await tick();
			expect(box).not.toHaveAttribute('aria-invalid');
			expect(box.validity.valid).toBe(true);
			await type(box, `${long[name]}b`);
			expect(box).toHaveAttribute('aria-invalid', 'true');
		}
	});

	test("What changed?'s message sits above the pinned bar from 700, so the bar keeps its height", () => {
		const barStyle = barSource.slice(barSource.indexOf('<style>'));
		const wide = barStyle.slice(barStyle.indexOf('@media (min-width: 700px)'));
		expect(cssRule(wide, '.field-message :global(.field-error)')).toMatch(
			/position:\s*absolute;\s*bottom:\s*calc\(100% - 1px\)/
		);
	});

	test('a server refusal of the tags shows under Tags and focuses the tag search, opening the details', async () => {
		for (const message of [CAP_MESSAGES.tag, CAP_MESSAGES.tags]) {
			renderWith({ title: 'Cookies', tags: ['one'] }, message);
			await tick();
			await tick();
			const search = screen.getByRole('combobox', { name: /tag/i });
			expect((document.querySelector('details') as HTMLDetailsElement).open).toBe(true);
			expect(search).toHaveFocus();
			expect(search).toHaveAccessibleDescription(message);
			expect(document.querySelector('.form-error')).toBeNull();
			cleanup();
		}
	});
});
