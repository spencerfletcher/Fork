import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import EditPage from './+page.svelte';
import { makeContent, makeIngredient, makeStep } from '#lib/recipes/fixtures.js';
import type { RecipeDraft } from '#lib/recipes/validation.js';

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

/** Runs the captured submit callback as SvelteKit would, returning the finish step. */
async function startSubmit() {
	const finish = (await captured.submits[0]({} as never)) as (input: unknown) => Promise<void>;
	await tick();
	return () => finish({ update: async () => {} }).then(tick);
}

const TAGS = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' },
	{ id: 3, name: 'Spicy', slug: 'spicy' }
];

function makeData(overrides: { imageUrl?: string | null } = {}) {
	return {
		recipe: {
			slug: 'cookies',
			title: 'Cookies',
			description: null,
			imageUrl: null,
			isPublic: false,
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
				steps: [makeStep('Mix.'), makeStep('Bake.', { type: 'tip', text: 'gently' })]
			})
		},
		allTags: TAGS
	} as never;
}

/** The draft the server would echo back for makeData, with overrides. */
function failed(draft: Partial<RecipeDraft>, error = 'Title is required') {
	const base: RecipeDraft = {
		title: 'Cookies',
		description: '',
		servings: '4',
		prepTimeMinutes: '10',
		cookTimeMinutes: '20',
		ingredients: '1 cup flour\n2 eggs',
		steps: 'Mix.\n\nBake.\ntip: gently',
		commitMessage: '',
		editRevision: '3',
		isPublic: false,
		tags: ['Dessert', 'Baking'],
		hadPhoto: false,
		removeImage: false
	};
	return { error, draft: { ...base, ...draft } };
}

const title = () => screen.getByLabelText(/^title/i) as HTMLInputElement;
const hiddenRevision = () =>
	document.querySelector('input[name="editRevision"]') as HTMLInputElement | null;

beforeEach(() => {
	captured.submits.length = 0;
	nav.guards.length = 0;
	vi.restoreAllMocks();
});

describe('Edit page form', () => {
	test('renders one form with one Save button', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(document.querySelectorAll('form')).toHaveLength(1);
		expect(document.querySelector('form')).toHaveAttribute('action', '?/save');
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /save info|save new version/i })).toBeNull();
	});

	test('fills title, servings and both textareas from the latest version', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(title()).toHaveValue('Cookies');
		expect(screen.getByLabelText(/serves/i)).toHaveValue(4);
		expect(screen.getByLabelText('Ingredients')).toHaveValue('1 cup flour\n2 eggs');
		expect(screen.getByLabelText('Steps')).toHaveValue('Mix.\n\nBake.\ntip: gently');
	});

	test('sends the loaded editRevision as a hidden field', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(hiddenRevision()).toHaveValue('3');
	});

	test('the header line says what the save will write after an edit and drops it when the value is restored', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		expect(screen.getByText('Editing v2 · saves as v3')).toBeInTheDocument();
		await fireEvent.input(title(), { target: { value: 'Cookies' } });
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
		expect(screen.queryByText(/saves/i)).toBeNull();
	});

	test('nothing about the outcome sits beside Save', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(title(), { target: { value: 'Biscuits' } });
		expect(document.querySelector('.form-actions .form-hint')).toBeNull();
		expect(screen.getByText(/saves as v3/).closest('.editor-header')).not.toBeNull();
	});

	test('treats a tag removed and added back as clean', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Dessert' }));
		expect(screen.getByText('Editing v2 · saves settings only')).toBeInTheDocument();
		await fireEvent.focus(screen.getByRole('combobox'));
		await fireEvent.click(screen.getByRole('option', { name: /Dessert/ }));
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
	});

	test('typing only a commit message is not an unsaved change', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(screen.getByLabelText(/what changed/i), { target: { value: 'note' } });
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
	});

	test('shows the version the save will write and what changed', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.input(screen.getByLabelText('Ingredients'), {
			target: { value: '1 cup flour\n3 eggs' }
		});
		await fireEvent.input(screen.getByLabelText('Steps'), {
			target: { value: 'Mix.\n\nBake longer.' }
		});
		expect(screen.getByText('Editing v2 · saves as v3')).toBeInTheDocument();
		expect(screen.getByLabelText(/what changed/i)).toHaveAttribute(
			'placeholder',
			'Updated ingredients, steps'
		);
	});

	test('a settings-only change says no version will be written', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByLabelText(/public/i));
		expect(screen.getByText('Editing v2 · saves settings only')).toBeInTheDocument();
	});

	test('a message typed on a settings-only change promises a version, since the save keeps it', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		await fireEvent.click(screen.getByLabelText(/public/i));
		expect(screen.getByText('Editing v2 · saves settings only')).toBeInTheDocument();
		const message = screen.getByLabelText(/what changed/i);
		await fireEvent.input(message, { target: { value: 'Private for now' } });
		expect(screen.getByText('Editing v2 · saves as v3')).toBeInTheDocument();
		await fireEvent.input(message, { target: { value: '  ' } });
		expect(screen.getByText('Editing v2 · saves settings only')).toBeInTheDocument();
	});

	test('choosing a photo file counts as a content change at once, before the preview loads', async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const file = new File(['x'], 'c.png', { type: 'image/png' });
		const input = screen.getByLabelText('Photo') as HTMLInputElement;
		Object.defineProperty(input, 'files', { value: [file] });
		await fireEvent.change(input);
		expect(screen.getByText('Editing v2 · saves as v3')).toBeInTheDocument();
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
		await fireEvent.click(screen.getByLabelText(/public/i));
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
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

	test('has Cancel back to the recipe beside Save, and the header names the version', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
			'href',
			'/recipes/cookies'
		);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit Recipe');
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
	});

	test('refills every field from form.draft after a failure and shows the error, not an outcome', async () => {
		render(EditPage, {
			props: {
				data: makeData(),
				form: failed({ title: 'Biscuits', prepTimeMinutes: '-5', tags: ['Spicy'], isPublic: true })
			}
		});
		await tick();
		expect(title()).toHaveValue('Biscuits');
		expect(screen.getByLabelText(/^prep/i)).toHaveValue(-5);
		const tags = [...document.querySelectorAll('input[name="tags"]')].map(
			(i) => (i as HTMLInputElement).value
		);
		expect(tags).toEqual(['Spicy']);
		expect(screen.getByLabelText(/public/i)).toBeChecked();
		expect(screen.queryByRole('alert')).toBeNull();
		expect(title()).toHaveAttribute('aria-invalid', 'true');
		expect(title()).toHaveAccessibleDescription('Title is required');
		expect(title()).toHaveFocus();
		// The draft is invalid, so there is nothing to promise, settings included.
		expect(screen.getByText('Editing v2')).toBeInTheDocument();
		expect(hiddenRevision()).toHaveValue('3');
	});

	test("a number below its floor is named under its own field with the server's wording", async () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		const servings = screen.getByLabelText(/serves/i);
		await fireEvent.input(servings, { target: { value: '0' } });
		await fireEvent.focusOut(servings);
		expect(servings).toHaveAttribute('aria-invalid', 'true');
		expect(servings).toHaveAccessibleDescription('Servings must be at least 1');
		expect(title()).not.toHaveAttribute('aria-invalid');
	});

	test('a server error for the ingredients lands under the ingredients box and focuses it', async () => {
		render(EditPage, {
			props: {
				data: makeData(),
				form: failed({ ingredients: 'x' }, 'An ingredient line is too long (300 characters max)')
			}
		});
		await tick();
		const box = screen.getByLabelText('Ingredients');
		expect(box).toHaveAccessibleDescription(/too long/);
		expect(box).toHaveFocus();
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('shows the conflict message as an alert', async () => {
		render(EditPage, {
			props: { data: makeData(), form: failed({}, 'This recipe was changed in another tab.') }
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent(/changed in another tab/);
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
		expect(screen.getByText('Editing v2 · saves as v3')).toBeInTheDocument();
	});
});
