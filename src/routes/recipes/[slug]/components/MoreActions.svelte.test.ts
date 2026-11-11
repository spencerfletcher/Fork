import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import MoreActions from './MoreActions.svelte';
import source from './MoreActions.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
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

async function openMenu(collections: (typeof TO_COOK)[] | null = [TO_COOK, QUICK]) {
	render(MoreActions, { props: { collections } });
	await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
	await tick();
	return screen.getByRole('menu', { name: 'More actions' });
}

/** Every row the arrow keys walk, in order: checkboxes and plain items alike. */
const rowsOf = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];

beforeEach(() => submits.clear());

describe('More actions', () => {
	test('an icon-only trigger, the ⋯ menu’s look, that opens a menu, saying so', () => {
		render(MoreActions, { props: { collections: null } });
		const button = screen.getByRole('button', { name: 'More actions' });
		expect(button).toHaveClass('more-button');
		expect(button).toHaveAttribute('aria-haspopup', 'menu');
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	test('in the library: the Collections group, New collection, then Print, in that order', async () => {
		const menu = await openMenu();
		const group = within(menu).getByRole('group', { name: 'Collections' });
		const items = rowsOf(menu).map((r) => r.textContent?.trim());
		expect(items).toEqual(['To cook', 'Quick', 'New collection', 'Print']);
		expect(within(group).queryByRole('menuitem', { name: 'Print' })).toBeNull();
		expect(within(menu).getByRole('separator')).toBeInTheDocument();
	});

	test('outside the library, or signed out, the menu holds Print alone', async () => {
		const menu = await openMenu(null);
		expect(within(menu).queryByRole('group')).toBeNull();
		expect(within(menu).queryByRole('separator')).toBeNull();
		const items = rowsOf(menu);
		expect(items.map((r) => r.textContent?.trim())).toEqual(['Print']);
		expect(items[0]).toHaveFocus();
	});

	test('Print closes the menu, hands focus back, then prints', async () => {
		const print = vi.spyOn(window, 'print').mockImplementation(() => {});
		const menu = await openMenu();
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'Print' }));
		await vi.waitFor(() => expect(print).toHaveBeenCalledOnce());
		expect(screen.queryByRole('menu')).toBeNull();
		expect(screen.getByRole('button', { name: 'More actions' })).toHaveFocus();
		print.mockRestore();
	});

	test('the arrow keys walk the collections and Print alike', async () => {
		const menu = await openMenu();
		const rows = rowsOf(menu);
		await fireEvent.keyDown(rows[0], { key: 'ArrowUp' });
		expect(rows.at(-1)).toHaveTextContent('Print');
		expect(rows.at(-1)).toHaveFocus();
		await fireEvent.keyDown(rows.at(-1)!, { key: 'ArrowDown' });
		expect(rows[0]).toHaveFocus();
	});
});

describe('More actions: collections', () => {
	test('each collection is a checkable row, checked where the recipe is, focus on the first', async () => {
		const menu = await openMenu();
		const rows = within(menu).getAllByRole('menuitemcheckbox');
		expect(rows.map((r) => r.textContent?.trim())).toEqual(['To cook', 'Quick']);
		expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
		expect(rows[0]).toHaveClass('menu-row');
		expect(rows[0]).toHaveFocus();
	});

	test('many collections scroll inside the menu, New collection and Print staying in view', () => {
		// jsdom lays nothing out, so the cap is read from the source.
		const rows = cssRule(source, '.collection-rows');
		expect(rows).toMatch(/max-height:\s*calc\(44px \* 6\.5\)/);
		expect(rows).toMatch(/overflow-y:\s*auto/);
	});

	test('a press flips the row at once, posts the state it asks for, and the menu stays open', async () => {
		const menu = await openMenu();
		const quick = within(menu).getByRole('menuitemcheckbox', { name: 'Quick' });
		const form = quick.closest('form')!;
		expect(form).toHaveAttribute('action', '?/collect');

		await fireEvent.click(quick);
		const sent = await playBack(form, { type: 'success' });
		expect(Object.fromEntries(sent)).toEqual({ collectionId: '6', member: '1' });
		expect(quick).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('menu', { name: 'More actions' })).toBe(menu);
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
		const row = screen.getByRole('menuitem', { name: 'New collection' });
		expect(row).toHaveFocus();
		await fireEvent.keyDown(row, { key: 'Escape' });
		await tick();
		expect(screen.queryByRole('menu')).toBeNull();
		expect(screen.getByRole('button', { name: 'More actions' })).toHaveFocus();
	});
});
