import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import AddToCollection from './AddToCollection.svelte';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';
import { SESSION_ENDED } from '#lib/server/actions.js';

// Each form's enhance callback, by form, so a test can play back a result.
type Result = { type: string; data?: Record<string, unknown> };
type Submit = (input: {
	formElement: HTMLFormElement;
	formData: FormData;
	cancel: () => void;
}) => Promise<(opts: { result: Result; update: () => Promise<void> }) => Promise<void>>;
const { submits } = vi.hoisted(() => ({ submits: new Map<HTMLFormElement, Submit>() }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: Submit) => {
		submits.set(form, submit);
		return { destroy: () => {} };
	}
}));
vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

const TO_COOK = { id: 5, name: 'To cook', count: 2, has: true };
const QUICK = { id: 6, name: 'Quick', count: 0, has: false };

/** Submits `form` through its captured enhance callback, ending in `result`. */
async function playBack(form: HTMLFormElement, result: Result) {
	const formData = new FormData(form);
	const handler = await submits.get(form)!({ formElement: form, formData, cancel: () => {} });
	await handler({ result, update: async () => {} });
	await tick();
	return formData;
}

async function openMenu() {
	render(AddToCollection, { props: { collections: [TO_COOK, QUICK] } });
	await fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
	await tick();
	return screen.getByRole('menu', { name: 'Collections' });
}

beforeEach(() => submits.clear());

describe('Add to collection', () => {
	test('a ghost pill that opens a menu, saying so', () => {
		render(AddToCollection, { props: { collections: [TO_COOK] } });
		const button = screen.getByRole('button', { name: 'Add to collection' });
		expect(button).toHaveClass('btn-ghost');
		expect(button).toHaveAttribute('aria-haspopup', 'menu');
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	test('each collection is a checkable row, checked where the recipe is, focus on the first', async () => {
		const menu = await openMenu();
		const rows = within(menu).getAllByRole('menuitemcheckbox');
		expect(rows.map((r) => r.textContent?.trim())).toEqual(['To cook', 'Quick']);
		expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
		expect(rows[0]).toHaveClass('menu-row');
		expect(rows[0]).toHaveFocus();
	});

	test('a press flips the row at once and posts the state it asks for', async () => {
		const menu = await openMenu();
		const quick = within(menu).getByRole('menuitemcheckbox', { name: 'Quick' });
		const form = quick.closest('form')!;
		expect(form).toHaveAttribute('action', '?/collect');

		const sent = await playBack(form, { type: 'success' });
		expect(Object.fromEntries(sent)).toEqual({ collectionId: '6', member: '1' });
		expect(quick).toHaveAttribute('aria-checked', 'true');
	});

	test('a refusal flips the row back and says why in the menu', async () => {
		const menu = await openMenu();
		const toCook = within(menu).getByRole('menuitemcheckbox', { name: 'To cook' });
		await playBack(toCook.closest('form')!, {
			type: 'failure',
			data: { code: 'unauthenticated', error: SESSION_ENDED('try again') }
		});
		expect(toCook).toHaveAttribute('aria-checked', 'true');
		expect(within(menu).getByRole('alert')).toHaveTextContent(SESSION_ENDED('try again'));
	});

	test('New collection names one in place; it is made with this recipe in it', async () => {
		const menu = await openMenu();
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'New collection' });
		expect(box).toHaveFocus();
		expect(box).toHaveAttribute('maxlength', String(COLLECTION_NAME_MAX));
		const form = box.closest('form')!;
		expect(form).toHaveAttribute('action', '?/newCollection');

		await fireEvent.input(box, { target: { value: 'Italian' } });
		await playBack(form, { type: 'failure', data: { code: 'invalid', error: 'Taken.' } });
		expect(screen.getByRole('alert')).toHaveTextContent('Taken.');
		expect(box).toHaveAttribute('aria-invalid', 'true');

		await playBack(form, { type: 'success' });
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(screen.getByRole('menuitem', { name: 'New collection' })).toHaveFocus();
	});

	test('Escape in the name box goes back to the list, then closes the menu', async () => {
		const menu = await openMenu();
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'New collection' }));
		await tick();
		await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
		await tick();
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(screen.getByRole('menuitem', { name: 'New collection' })).toHaveFocus();
	});
});
