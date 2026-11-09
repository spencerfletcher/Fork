import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import source from './RecipeForm.svelte?raw';
import photoSource from './PhotoField.svelte?raw';
import RecipeForm from './RecipeForm.svelte';
import {
	draftOf,
	PHOTO_TYPES,
	PHOTO_MAX_BYTES,
	PHOTO_SIZE_MESSAGE,
	emptyGroupMessage,
	type Visibility
} from '#lib/recipes/validation.js';
import { MAKES_TOO_LONG, MAX_MAKES } from '#lib/recipes/limits.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: () => {} }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// jsdom has no layout or scrolling: the rects are set by hand and the scroll recorded.
const scrollIntoView = vi.fn();
const reduced = { matches: false };

// jsdom applies no component CSS, so the declarations are read from the source.
const style = source.slice(source.indexOf('<style>'));

describe('RecipeForm photo buttons', () => {
	test('reach 44px on a phone or under a coarse pointer', () => {
		const photoStyle = photoSource.slice(photoSource.indexOf('<style>'));
		const media = photoStyle.slice(
			photoStyle.indexOf('@media (max-width: 699px), (pointer: coarse)')
		);
		const block = media.slice(0, media.indexOf('\n\t}\n'));
		expect(block).toMatch(/\.photo-choose,\s*\.photo-keep\s*{[^}]*min-height:\s*44px/);
	});
});

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
		expect(screen.getByText('Choose a photo')).toBeInTheDocument();
		await pick(PHOTO_MAX_BYTES);
		expect(screen.queryByText(PHOTO_SIZE_MESSAGE)).toBeNull();
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(screen.getByLabelText('Replace photo')).toBe(input);
	});
});

describe('RecipeForm photo removed on a new recipe', () => {
	// No stored photo, so no Keep photo takes the place of the ×: focus goes to the input.
	test('focus moves to the photo input, not the page', async () => {
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
		expect(document.activeElement).toBe(input);
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

describe('RecipeForm actions on a phone', () => {
	// Every phone-only block, joined, so the test does not care which one holds a rule.
	const phone = style
		.split('@media (max-width: 699px) {')
		.slice(1)
		.map((rest) => rest.slice(0, rest.indexOf('\n\t}\n')))
		.join('\n');
	const rule = (selector: string) => {
		const at = phone.indexOf(`${selector} {`);
		return at < 0 ? '' : phone.slice(at, phone.indexOf('}', at));
	};

	test('a field focused near the bottom scrolls clear of the bar', () => {
		expect(rule(':global(html:has(.form-actions))')).toMatch(
			/scroll-padding-bottom:[^;]*env\(safe-area-inset-bottom\)/
		);
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
		const bar = screen.getByRole('button', { name: 'Create recipe' }).parentElement!;
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
		const at = style.indexOf("textarea[name='title'] {");
		const rule = style.slice(at, style.indexOf('}', at));
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

	test('the stored audience is the checked radio, and a click moves it', async () => {
		renderWith('friends');
		expect(screen.getByRole('radio', { name: 'Friends' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Only me' })).not.toBeChecked();
		await fireEvent.click(screen.getByRole('radio', { name: 'Public' }));
		expect(screen.getByRole('radio', { name: 'Public' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Friends' })).not.toBeChecked();
	});

	test('a private draft checks Only me by default', () => {
		renderWith('private');
		expect(screen.getByRole('radio', { name: 'Only me' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Friends' })).not.toBeChecked();
		expect(screen.getByRole('radio', { name: 'Public' })).not.toBeChecked();
	});

	test('with forks, each choice is described as leaving them too', () => {
		renderWith('public', { hasForks: true });
		expect(screen.getByRole('radio', { name: 'Only me' })).toHaveAccessibleDescription(
			"Only you can see it. You can share it later. Making this more private doesn't hide existing forks."
		);
	});

	test('without forks there is no hint', () => {
		renderWith('public');
		expect(screen.queryByText(/existing forks/)).toBeNull();
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
