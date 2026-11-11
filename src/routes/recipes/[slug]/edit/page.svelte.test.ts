import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import EditPage from './+page.svelte';
import { inGroup, makeContent, makeIngredient, makeStep } from '#lib/recipes/fixtures.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { numberMessages, type RecipeDraft, REQUIRED_MESSAGES } from '#lib/recipes/validation.js';
import { UNREACHABLE_MESSAGE } from '#lib/pendingEnhance.svelte.js';
import { draftKey, saveDraft } from '#lib/drafts.js';

// Capture the form's submit callback so a test can drive the pending state by hand.
const captured = vi.hoisted(() => ({ submits: [] as SubmitFunction[] }));
type Guard = (n: { cancel: () => void; type: string }) => void;
const nav = vi.hoisted(() => ({ guards: [] as Guard[] }));
vi.mock('$app/navigation', () => ({ beforeNavigate: (fn: Guard) => nav.guards.push(fn) }));
vi.mock('$app/forms', () => ({
	enhance: (_node: HTMLFormElement, submit: SubmitFunction) => {
		captured.submits.push(submit);
		return { destroy: () => {} };
	}
}));

/** The header's outcome line, matched on its whole text: its version ids sit in spans of their own. */
const editingLine = (text: string) =>
	screen.getByText((_, el) => !!el?.matches('.editing') && el.textContent === text);

/** Runs the captured submit callback as SvelteKit would, returning the finish step. */
async function startSubmit() {
	const finish = (await captured.submits[0]({} as never)) as (input: unknown) => Promise<void>;
	await tick();
	return () => finish({ result: { type: 'failure' }, update: async () => {} }).then(tick);
}

const TAGS = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' },
	{ id: 3, name: 'Spicy', slug: 'spicy' }
];

function makeData(
	overrides: { imageUrl?: string | null; content?: Partial<RecipeContent>; forkCount?: number } = {}
) {
	return {
		recipe: {
			id: 7,
			slug: 'cookies',
			title: 'Cookies',
			description: null,
			imageUrl: null,
			visibility: 'private',
			editRevision: 3,
			recipesToTags: [{ tag: TAGS[0] }, { tag: TAGS[1] }]
		},
		latestVersion: {
			versionNumber: 2,
			commitMessage: 'Tweak',
			...makeContent({
				title: 'Cookies',
				servings: 4,
				prepTimeMinutes: 10,
				cookTimeMinutes: 20,
				imageUrl: overrides.imageUrl ?? null,
				ingredients: [makeIngredient('1 cup flour'), makeIngredient('2 eggs')],
				steps: [makeStep('Mix.'), makeStep('Bake.', { type: 'tip', text: 'gently' })],
				...overrides.content
			})
		},
		allTags: TAGS,
		forkCount: overrides.forkCount ?? 0
	} as never;
}

/** The draft the server would echo back for makeData, with overrides. */
function failed(draft: Partial<RecipeDraft>, error: string = REQUIRED_MESSAGES.title) {
	const base: RecipeDraft = {
		title: 'Cookies',
		description: '',
		servings: '4',
		makes: '',
		prepTimeMinutes: '10',
		cookTimeMinutes: '20',
		ingredients: '1 cup flour\n2 eggs',
		steps: 'Mix.\n\nBake.\ntip: gently',
		commitMessage: '',
		editRevision: '3',
		visibility: 'private',
		tags: ['Dessert', 'Baking'],
		hadPhoto: false,
		removeImage: false
	};
	return { error, code: 'invalid' as const, draft: { ...base, ...draft } };
}

const title = () => screen.getByLabelText(/^title/i) as HTMLInputElement;
// The textarea behind a live text box: what submits, and what the browser validates.
const textField = (name: 'ingredients' | 'steps') =>
	document.querySelector<HTMLTextAreaElement>(`textarea[name="${name}"]`)!;
const hiddenRevision = () =>
	document.querySelector('input[name="editRevision"]') as HTMLInputElement | null;

beforeEach(() => {
	captured.submits.length = 0;
	nav.guards.length = 0;
	vi.restoreAllMocks();
	localStorage.clear();
});

describe('Edit page forks hint', () => {
	test('a recipe with forks shows the hint under the audience radios', () => {
		render(EditPage, { props: { data: makeData({ forkCount: 2 }), form: null } });
		expect(screen.getByText("Making this more private doesn't hide existing forks.")).toBeTruthy();
	});

	test('a recipe without forks has no hint', () => {
		render(EditPage, { props: { data: makeData({ forkCount: 0 }), form: null } });
		expect(screen.queryByText(/existing forks/)).toBeNull();
	});
});

describe('Edit page form', () => {
	test('renders one save form with one Save button, and the delete form after it', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
		const actions = [...document.querySelectorAll('form')].map((f) => f.getAttribute('action'));
		expect(actions).toEqual(['?/save', '?/deleteRecipe']);
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /save info|save new version/i })).toBeNull();
	});

	test('fills title, servings and both textareas from the latest version', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(title()).toHaveValue('Cookies');
		expect(screen.getByLabelText(/serves/i)).toHaveValue(4);
		expect(textField('ingredients')).toHaveValue('1 cup flour\n2 eggs');
		expect(textField('steps')).toHaveValue('Mix.\n\nBake.\ntip: gently');
	});

	test('a grouped version with a yield refills its "# Name" lines and Makes, and reads clean', () => {
		render(EditPage, {
			props: {
				data: makeData({
					content: {
						makes: '24 cookies',
						ingredients: inGroup('Dough', [
							makeIngredient('1 cup flour'),
							makeIngredient('2 eggs')
						]),
						steps: [makeStep('Preheat.'), ...inGroup('Bake', [makeStep('Bake.')])]
					}
				}),
				form: null
			}
		});
		expect(textField('ingredients')).toHaveValue('# Dough\n1 cup flour\n2 eggs');
		expect(textField('steps')).toHaveValue('Preheat.\n\n# Bake\nBake.');
		expect(screen.getByLabelText(/^Makes/)).toHaveValue('24 cookies');
		expect(document.getElementById('ingredients-readback')).toHaveTextContent(
			'Reads as 1 group: Dough 2 lines'
		);
		expect(document.querySelector('.editing')?.textContent ?? '').not.toMatch(/saves as/);
	});

	test('an ungrouped version with no yield refills as before, with Makes empty and no read-back', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByLabelText(/^Makes/)).toHaveValue('');
		expect(document.getElementById('ingredients-readback')).toBeNull();
		expect(document.getElementById('steps-readback')).toBeNull();
	});

	test('sends the loaded editRevision as a hidden field', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(hiddenRevision()).toHaveValue('3');
	});

	test('the header line says what the save will write after an edit and drops it when the value is restored', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(editingLine('Editing v2')).toBeInTheDocument();
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
		await fireEvent.input(title(), { target: { value: 'Cookies' } });
		expect(editingLine('Editing v2')).toBeInTheDocument();
		expect(screen.queryByText(/saves/i)).toBeNull();
	});

	test('the header line sets each version id apart from the words around it', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(within(editingLine('Editing v2')).getByText('v2')).toBeInTheDocument();
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		const line = editingLine('Editing v2 · saves as v3');
		expect(within(line).getByText('v2')).toBeInTheDocument();
		expect(within(line).getByText('v3')).toBeInTheDocument();
	});

	test('nothing about the outcome sits beside Save', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		expect(document.querySelector('.form-actions .form-hint')).toBeNull();
		expect(editingLine('Editing v2 · saves as v3').closest('.editor-header')).not.toBeNull();
	});

	test('treats a tag removed and added back as clean', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Dessert' }));
		expect(editingLine('Editing v2 · saves settings only')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('combobox'));
		await fireEvent.click(screen.getByRole('option', { name: /Dessert/ }));
		expect(editingLine('Editing v2')).toBeInTheDocument();
	});

	test('a message typed with nothing else changed promises a version and guards leaving; whitespace does not', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
		render(EditPage, { props: { data: makeData(), form: null } });
		const message = screen.getByLabelText(/what changed/i);
		await fireEvent.input(message, { target: { value: 'note' } });
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'link' });
		expect(confirm).toHaveBeenCalled();
		expect(cancel).toHaveBeenCalled();

		await fireEvent.input(message, { target: { value: '  ' } });
		expect(editingLine('Editing v2')).toBeInTheDocument();
		confirm.mockClear();
		nav.guards[0]({ cancel: vi.fn(), type: 'link' });
		expect(confirm).not.toHaveBeenCalled();
	});

	test('shows the version the save will write and what changed', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(textField('ingredients'), {
			target: { value: '1 cup flour\n3 eggs' }
		});
		await fireEvent.input(textField('steps'), {
			target: { value: 'Mix.\n\nBake longer.' }
		});
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
		expect(screen.getByLabelText(/what changed/i)).toHaveAttribute(
			'placeholder',
			'Updated ingredients, steps'
		);
	});

	test('a settings-only change says no version will be written', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('radio', { name: 'Friends' }));
		expect(editingLine('Editing v2 · saves settings only')).toBeInTheDocument();
	});

	test('a message typed on a settings-only change promises a version, since the save keeps it', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('radio', { name: 'Friends' }));
		expect(editingLine('Editing v2 · saves settings only')).toBeInTheDocument();
		const message = screen.getByLabelText(/what changed/i);
		await fireEvent.input(message, { target: { value: 'Private for now' } });
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
		await fireEvent.input(message, { target: { value: '  ' } });
		expect(editingLine('Editing v2 · saves settings only')).toBeInTheDocument();
	});

	test('choosing a photo file counts as a content change at once, before the preview loads', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const file = new File(['x'], 'c.png', { type: 'image/png' });
		const input = screen.getByLabelText('Choose a photo') as HTMLInputElement;
		Object.defineProperty(input, 'files', { value: [file] });
		await fireEvent.change(input);
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
	});

	test('the placeholder falls back when nothing has changed', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByLabelText(/what changed/i)).toHaveAttribute(
			'placeholder',
			'What changed in this version?'
		);
	});

	test('a dirty form asks before navigating away and cancels on no', async () => {
		vi.spyOn(window, 'confirm').mockReturnValue(false);
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'link' });
		expect(window.confirm).toHaveBeenCalled();
		expect(cancel).toHaveBeenCalled();
	});

	test('an invalid draft with a settings change promises nothing', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: '' } });
		await fireEvent.click(screen.getByRole('radio', { name: 'Friends' }));
		expect(editingLine('Editing v2')).toBeInTheDocument();
	});

	test('a dirty form navigates away when the question is accepted', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'link' });
		expect(confirm).toHaveBeenCalledWith('Leave without saving? Your changes will be lost.');
		expect(cancel).not.toHaveBeenCalled();
	});

	test('a tab close on a dirty form is cancelled without our question, so the browser asks', async () => {
		const confirm = vi.spyOn(window, 'confirm');
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'leave' });
		expect(confirm).not.toHaveBeenCalled();
		expect(cancel).toHaveBeenCalled();
	});

	test('a clean form navigates away without asking', () => {
		const confirm = vi.spyOn(window, 'confirm');
		render(EditPage, { props: { data: makeData(), form: null } });
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'link' });
		expect(confirm).not.toHaveBeenCalled();
		expect(cancel).not.toHaveBeenCalled();
	});

	test('the guard stays quiet while the form is submitting', async () => {
		const confirm = vi.spyOn(window, 'confirm');
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		await startSubmit();
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'goto' });
		expect(confirm).not.toHaveBeenCalled();
		expect(cancel).not.toHaveBeenCalled();
	});

	test('the guard stays quiet while a delete is pending: its redirect leaves the dirty form', async () => {
		const confirm = vi.spyOn(window, 'confirm');
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
		await captured.submits[1]({} as never);
		await tick();
		const cancel = vi.fn();
		nav.guards[0]({ cancel, type: 'goto' });
		expect(confirm).not.toHaveBeenCalled();
		expect(cancel).not.toHaveBeenCalled();
	});

	test("a refused delete shows under Delete, not in the editor's error box", async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
		// ownRecipe throws error(403); enhance hands it back as an error result.
		const finish = (await captured.submits[1]({} as never)) as (input: unknown) => Promise<void>;
		const update = vi.fn(async () => {});
		const result = { type: 'error', status: 403, error: { message: 'Not authorized' } };
		await finish({ result, update }).then(tick);
		expect(update).not.toHaveBeenCalled();
		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent('Not authorized');
		// Under Delete recipe, on the actions row's right.
		expect(alert.closest('.form-actions .danger')).not.toBeNull();
		expect(title()).toHaveValue('Cookies');
	});

	test('has Cancel back to the recipe beside Save, and the header names the version', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
			'href',
			'/recipes/cookies'
		);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit Recipe');
		expect(editingLine('Editing v2')).toBeInTheDocument();
	});

	test('refills every field from form.draft after a failure and shows the error, not an outcome', async () => {
		render(EditPage, {
			props: {
				data: makeData(),
				form: failed({
					title: 'Biscuits',
					prepTimeMinutes: '-5',
					tags: ['Spicy'],
					visibility: 'friends'
				})
			}
		});
		await tick();
		expect(title()).toHaveValue('Biscuits');
		expect(screen.getByLabelText(/^prep/i)).toHaveValue(-5);
		const tags = [...document.querySelectorAll('input[name="tags"]')].map(
			(i) => (i as HTMLInputElement).value
		);
		expect(tags).toEqual(['Spicy']);
		expect(screen.getByRole('radio', { name: 'Friends' })).toBeChecked();
		expect(document.querySelector('.form-error')).toBeNull();
		expect(title()).toHaveAttribute('aria-invalid', 'true');
		expect(title()).toHaveAccessibleDescription(REQUIRED_MESSAGES.title);
		expect(title()).toHaveFocus();
		// The draft is invalid, so there is nothing to promise, settings included.
		expect(editingLine('Editing v2')).toBeInTheDocument();
		expect(hiddenRevision()).toHaveValue('3');
	});

	test('a blocked save says in the outcome line how many fields need attention, and focuses the first', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const ingredients = textField('ingredients');
		await fireEvent.input(title(), { target: { value: '' } });
		await fireEvent.input(ingredients, { target: { value: '' } });
		// The browser fires invalid on each bad field in order when Save is pressed.
		for (const el of [title(), ingredients]) {
			el.dispatchEvent(new Event('invalid', { cancelable: true }));
		}
		await tick();
		expect(editingLine('Editing v2 · 2 fields need attention')).toBeInTheDocument();
		expect(title()).toHaveFocus();
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		expect(editingLine('Editing v2 · 1 field needs attention')).toBeInTheDocument();
	});

	test("a number below its floor is named under its own field with the server's wording", async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const servings = screen.getByLabelText(/serves/i);
		await fireEvent.input(servings, { target: { value: '0' } });
		await fireEvent.focusOut(servings);
		expect(servings).toHaveAttribute('aria-invalid', 'true');
		expect(servings).toHaveAccessibleDescription(numberMessages('servings').belowMin);
		// A blur error is announced, not only shown.
		expect(screen.getByRole('alert')).toHaveTextContent(numberMessages('servings').belowMin);
		expect(title()).not.toHaveAttribute('aria-invalid');
	});

	test.each([
		['prepTimeMinutes', '-5', 'belowMin'],
		['cookTimeMinutes', '1.5', 'whole'],
		['cookTimeMinutes', '-1.5', 'whole'],
		['servings', '2.5', 'whole']
	] as const)("%s %j says the server's %s message on blur", async (name, value, kind) => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const field = document.getElementById(name) as HTMLInputElement;
		await fireEvent.input(field, { target: { value } });
		await fireEvent.focusOut(field);
		expect(field).toHaveAccessibleDescription(numberMessages(name)[kind]);
	});

	test('number errors sit under the whole row, in field order, each still describing its own box', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		for (const [name, value] of [
			['cookTimeMinutes', '1.5'],
			['servings', '0']
		]) {
			const field = document.getElementById(name) as HTMLInputElement;
			await fireEvent.input(field, { target: { value } });
			await fireEvent.focusOut(field);
		}
		const row = document.getElementById('servings')!.closest('.field-row')!;
		const errors = [...row.children].filter((el) => el.matches('.field-error'));
		expect(errors.map((el) => el.id)).toEqual(['servings-error', 'cookTimeMinutes-error']);
		// After all three boxes, not inside a column.
		const lastField = row.querySelector('#cookTimeMinutes')!.closest('.field')!;
		expect(
			lastField.compareDocumentPosition(errors[0]) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		expect(document.getElementById('servings')).toHaveAccessibleDescription(
			numberMessages('servings').belowMin
		);
		expect(document.getElementById('cookTimeMinutes')).toHaveAttribute('aria-invalid', 'true');
		expect(document.getElementById('cookTimeMinutes')).toHaveAccessibleDescription(
			numberMessages('cookTimeMinutes').whole
		);
		expect(document.getElementById('prepTimeMinutes')).not.toHaveAttribute('aria-invalid');
	});

	test('a server error for the ingredients lands under the ingredients box and focuses it', async () => {
		render(EditPage, {
			props: {
				data: makeData(),
				form: failed({ ingredients: 'x' }, 'An ingredient line is too long (300 characters max)')
			}
		});
		await tick();
		const box = screen.getByRole('textbox', { name: /^ingredients/i });
		expect(box).toHaveAccessibleDescription(/too long/);
		expect(box).toHaveFocus();
		expect(screen.getByRole('alert')).toHaveAttribute('id', 'ingredients-error');
		expect(document.querySelector('.form-error')).toBeNull();
	});

	test('shows the conflict message as an alert', async () => {
		render(EditPage, {
			props: { data: makeData(), form: failed({}, 'This recipe was changed in another tab.') }
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent(/changed in another tab/);
	});

	test('an unreachable server keeps the edits on the page and says so, without applying the error', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Cookies, edited' } });
		const finish = (await captured.submits[0]({} as never)) as (input: unknown) => Promise<void>;
		const update = vi.fn(async () => {});
		await finish({ result: { type: 'error', error: new TypeError('fetch failed') }, update }).then(
			tick
		);
		expect(update).not.toHaveBeenCalled();
		expect(title()).toHaveValue('Cookies, edited');
		expect(title()).toBeEnabled();
		expect(screen.getByRole('alert')).toHaveTextContent(UNREACHABLE_MESSAGE);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
	});

	test('disables every field while saving and re-enables them when it finishes', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const finish = await startSubmit();
		expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
		expect(title()).toBeDisabled();
		await finish();
		expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		expect(title()).toBeEnabled();
	});

	test('asks for the photo again only when one had been chosen and the input is now empty', async () => {
		const { unmount } = render(EditPage, {
			props: { data: makeData(), form: failed({ hadPhoto: true }) }
		});
		await tick();
		expect(screen.getByText(/choose the photo again/i)).toBeInTheDocument();
		unmount();
		render(EditPage, { props: { data: makeData(), form: failed({ hadPhoto: false }) } });
		await tick();
		expect(screen.queryByText(/choose the photo again/i)).toBeNull();
	});

	test('a photo is chosen with a text button over the hidden native input: Choose a photo, or Replace under one', async () => {
		const photoInput = () => document.querySelector('input[name="image"]') as HTMLInputElement;
		const { unmount } = render(EditPage, { props: { data: makeData(), form: null } });
		expect(photoInput()).toHaveClass('sr-only');
		const button = photoInput().closest('label')!;
		expect(button).toHaveClass('text-btn');
		expect(button).toHaveTextContent(/^\s*Choose a photo\s*$/);
		// One name, the button's, not the field label's "Photo" before it.
		expect(photoInput()).toHaveAccessibleName('Choose a photo');
		unmount();

		render(EditPage, {
			props: { data: makeData({ imageUrl: 'https://cdn/cookies.png' }), form: null }
		});
		expect(photoInput().closest('label')).toHaveTextContent('Replace photo');
		expect(photoInput()).toHaveAccessibleName('Replace photo');
		// Below the photo, never over it.
		const photo = screen.getByRole('img', { name: /preview/i });
		const remove = screen.getByRole('button', { name: /remove photo/i });
		for (const action of [photoInput().closest('label')!, remove]) {
			expect(photo.contains(action)).toBe(false);
			expect(photo.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		}
		await fireEvent.click(remove);
		expect(photoInput().closest('label')).toHaveTextContent('Choose a photo');
	});

	test('shows the current photo and a Remove photo control that marks it for removal', async () => {
		render(EditPage, {
			props: { data: makeData({ imageUrl: 'https://cdn/cookies.png' }), form: null }
		});
		expect(screen.getByRole('img', { name: /preview/i })).toHaveAttribute(
			'src',
			'https://cdn/cookies.png'
		);
		expect(document.querySelector('input[name="removeImage"]')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: /remove photo/i }));
		expect(screen.queryByRole('img', { name: /preview/i })).toBeNull();
		expect(document.querySelector('input[name="removeImage"]')).toHaveValue('on');
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
	});

	test('Keep photo, offered once the photo is marked for removal, brings it back and unmarks it', async () => {
		render(EditPage, {
			props: { data: makeData({ imageUrl: 'https://cdn/cookies.png' }), form: null }
		});
		expect(screen.queryByRole('button', { name: 'Keep photo' })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: /remove photo/i }));
		await tick();
		const keep = screen.getByRole('button', { name: 'Keep photo' });
		expect(keep).toHaveClass('text-btn');
		expect(keep).toHaveAttribute('type', 'button');
		// The control pressed has gone; focus lands on the way back, not the page.
		expect(keep).toHaveFocus();
		await fireEvent.click(keep);
		await tick();
		expect(screen.getByRole('img', { name: /preview/i })).toHaveAttribute(
			'src',
			'https://cdn/cookies.png'
		);
		expect(document.querySelector('input[name="removeImage"]')).toBeNull();
		expect(screen.queryByRole('button', { name: 'Keep photo' })).toBeNull();
		expect(screen.getByRole('button', { name: /remove photo/i })).toHaveFocus();
		expect(document.querySelector('input[name="image"]')).toHaveAccessibleName('Replace photo');
		// Nothing left to save: the form is clean again.
		expect(editingLine('Editing v2')).toBeInTheDocument();
	});
});

describe('Edit page drafts on this device', () => {
	const USER = 'user-a';
	const KEY = draftKey(USER, '7');
	const signedIn = (user = USER) => ({ ...(makeData() as object), user: { id: user } }) as never;
	const MINUTE = 60 * 1000;
	/** Stores what the device would hold for makeData's recipe, with overrides. */
	const seed = (draft: Partial<RecipeDraft>, ago = 5 * MINUTE, photoLost = false) =>
		saveDraft(KEY, { draft: failed(draft).draft, savedAt: Date.now() - ago, photoLost });
	const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null');
	const line = () => document.querySelector('.editing');
	const discard = () => screen.getByRole('button', { name: 'Discard draft' });
	const noDiscard = () => screen.queryByRole('button', { name: 'Discard draft' });

	test('a stored draft that differs is restored and the state line says so, with its age', () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn(), form: null } });
		expect(title()).toHaveValue('Chewy cookies');
		expect(line()).toHaveTextContent(
			'Editing v2 · saves as v3 · Draft from 5 minutes ago restored. Discard draft'
		);
		expect(line()).toHaveAttribute('aria-live', 'polite');
		expect(discard()).toHaveClass('text-btn');
	});

	test('Discard draft returns to the server’s content and forgets the draft', async () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn(), form: null } });
		await fireEvent.click(discard());
		expect(title()).toHaveValue('Cookies');
		expect(editingLine('Editing v2')).toBeInTheDocument();
		expect(stored()).toBeNull();
	});

	test('a draft the same as the server’s content is not offered, and is cleared', async () => {
		seed({});
		render(EditPage, { props: { data: signedIn(), form: null } });
		await tick();
		expect(noDiscard()).toBeNull();
		expect(stored()).toBeNull();
	});

	test('a draft from before the recipe changed is offered, says so, and keeps its revision', () => {
		seed({ title: 'Chewy cookies', editRevision: '2' });
		render(EditPage, { props: { data: signedIn(), form: null } });
		expect(title()).toHaveValue('Chewy cookies');
		expect(line()).toHaveTextContent(
			'restored. The recipe has changed since, so saving this draft will be refused.'
		);
		// The server's stale check compares this, so a blind overwrite is refused.
		expect(hiddenRevision()).toHaveValue('2');
	});

	test('a chosen photo is not kept, and the restore says so', () => {
		seed({ title: 'Chewy cookies' }, MINUTE, true);
		render(EditPage, { props: { data: signedIn(), form: null } });
		expect(line()).toHaveTextContent(
			"Draft from 1 minute ago restored. The photo you chose wasn't kept."
		);
	});

	test('another user’s draft on the same device is never shown', () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn('user-b'), form: null } });
		expect(title()).toHaveValue('Cookies');
		expect(noDiscard()).toBeNull();
	});

	test('a failed save’s reply wins over a stored draft', () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn(), form: failed({ title: 'From the server' }) } });
		expect(title()).toHaveValue('From the server');
		expect(noDiscard()).toBeNull();
	});

	test('typing is stored after a pause, not on the keystroke', async () => {
		vi.useFakeTimers();
		try {
			render(EditPage, { props: { data: signedIn(), form: null } });
			await fireEvent.input(title(), { target: { value: 'Chewy cookies' } });
			expect(stored()).toBeNull();
			await vi.advanceTimersByTimeAsync(1000);
			expect(stored().draft.title).toBe('Chewy cookies');
			expect(stored().draft.editRevision).toBe('3');
		} finally {
			vi.useRealTimers();
		}
	});

	test('hiding the page stores the draft at once', async () => {
		render(EditPage, { props: { data: signedIn(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Chewy cookies' } });
		window.dispatchEvent(new Event('pagehide'));
		expect(stored().draft.title).toBe('Chewy cookies');
	});

	test('typing back to the server’s content clears the draft and its line', async () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Cookies' } });
		window.dispatchEvent(new Event('pagehide'));
		await tick();
		expect(stored()).toBeNull();
		expect(noDiscard()).toBeNull();
	});

	test('a successful save clears the draft; a failed one keeps it', async () => {
		seed({ title: 'Chewy cookies' });
		render(EditPage, { props: { data: signedIn(), form: null } });
		const run = async (type: string) => {
			const finish = (await captured.submits[0]({} as never)) as (i: unknown) => Promise<void>;
			await finish({ result: { type }, update: async () => {} });
			window.dispatchEvent(new Event('pagehide'));
		};
		await run('failure');
		expect(stored().draft.title).toBe('Chewy cookies');
		await run('redirect');
		expect(stored()).toBeNull();
	});

	test('storage that throws leaves the editor working', async () => {
		const refuse = () => {
			throw new DOMException('refused', 'QuotaExceededError');
		};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse);
		render(EditPage, { props: { data: signedIn(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Chewy cookies' } });
		window.dispatchEvent(new Event('pagehide'));
		expect(editingLine('Editing v2 · saves as v3')).toBeInTheDocument();
	});
});
