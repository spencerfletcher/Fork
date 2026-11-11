import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import MoreActions from './MoreActions.svelte';
import source from './MoreActions.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { EXPORT_FORMATS, FORMAT_LABEL, exportHref } from '#lib/export/archive.js';
import { TRASH_DAYS } from '#lib/trash.js';

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
	},
	// The test's fetch answers in JSON already.
	deserialize: (text: string) => JSON.parse(text)
}));
vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

const TO_COOK = { id: 5, name: 'To cook', count: 2, has: true };
const QUICK = { id: 6, name: 'Quick', count: 0, has: false };

/** The recipe page's menu: Print, and the reader's collections as loaded with the page. */
const PAGE = { slug: 'buns-x1', title: 'Buns', print: true };

/** Submits `form` through its captured enhance callback, ending in `result`. */
async function playBack(form: HTMLFormElement, result: Result) {
	const formData = new FormData(form);
	const handler = await submits.get(form)!({ formElement: form, formData, cancel: () => {} });
	await handler({ result, update: async () => {} });
	await tick();
	return formData;
}

async function openMenu(collections: (typeof TO_COOK)[] | null = [TO_COOK, QUICK]) {
	render(MoreActions, { props: { ...PAGE, collections } });
	await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
	await tick();
	return screen.getByRole('menu', { name: 'More actions' });
}

/** Every row the arrow keys walk, in order: checkboxes and plain items alike. */
const rowsOf = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];

beforeEach(() => submits.clear());

describe('More actions', () => {
	test('an icon-only trigger, the ⋯ menu’s look, that opens a menu, saying so', () => {
		render(MoreActions, { props: { ...PAGE, collections: null } });
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

describe('More actions: Export', () => {
	test('the owner gets an Export row per format after Print, each a download of this recipe', async () => {
		render(MoreActions, { props: { ...PAGE, collections: null, exports: true } });
		await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
		await tick();
		const menu = screen.getByRole('menu', { name: 'More actions' });
		const rows = rowsOf(menu);
		const names = EXPORT_FORMATS.map((f) => `Export ${FORMAT_LABEL[f]}`);
		expect(rows.map((r) => r.textContent?.trim())).toEqual(['Print', ...names]);
		for (const [i, format] of EXPORT_FORMATS.entries()) {
			const row = within(menu).getByRole('menuitem', { name: names[i] });
			expect(row).toHaveAttribute('href', exportHref(format, PAGE.slug));
			expect(row).toHaveAttribute('download');
			expect(row).toHaveClass('menu-row');
		}
	});

	test('anyone else gets no Export row', async () => {
		const menu = await openMenu();
		expect(within(menu).queryByRole('menuitem', { name: /Export/ })).toBeNull();
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
		expect(form).toHaveAttribute('action', `/recipes/${PAGE.slug}?/collect`);

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
		expect(form).toHaveAttribute('action', `/recipes/${PAGE.slug}?/newCollection`);

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

// ─── On a Cookbook card ───────────────────────────────────────────────────────

/** A card's menu: its collections asked for as it opens, named for its recipe. */
const CARD = {
	slug: 'lemon-cake-x2',
	title: 'Lemon Cake',
	collections: 'on-open' as const,
	label: 'More actions for Lemon Cake',
	journal: true
};
const OWN = { ...CARD, edit: true, exports: true, trash: true };
const SAVED = { ...CARD, fork: true };
const KEPT = { ...CARD, removeCopy: true };

const fetchMock = vi.fn();

/** The collections action's answer, as the fetch on open reads it. */
function answer(result: Result) {
	fetchMock.mockResolvedValue({ text: async () => JSON.stringify(result) });
}

/** Runs `form`'s enhance callback to `result`, with an `update` spy to say whether the page reloaded. */
async function settle(form: HTMLFormElement, result: Result) {
	const update = vi.fn();
	const handler = await submits.get(form)!({
		formElement: form,
		formData: new FormData(form),
		cancel: () => {}
	});
	await handler({ result, update });
	await tick();
	return update;
}

async function openCard(props: Record<string, unknown>) {
	render(MoreActions, { props: props as never });
	await fireEvent.click(screen.getByRole('button', { name: CARD.label }));
	const menu = screen.getByRole('menu', { name: 'More actions' });
	await vi.waitFor(() => expect(within(menu).queryByText('Loading collections…')).toBeNull());
	return menu;
}

describe('More actions on a Cookbook card', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		answer({ type: 'success', data: { collections: [TO_COOK, QUICK] } });
	});

	test('the trigger is the ⋯, named for the recipe, and asks nothing until opened', () => {
		render(MoreActions, { props: OWN });
		const button = screen.getByRole('button', { name: 'More actions for Lemon Cake' });
		expect(button).toHaveClass('more-button');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('opening asks the recipe’s own collections action, then lists them', async () => {
		const menu = await openCard(OWN);
		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(`/recipes/${CARD.slug}?/collections`);
		expect(init).toMatchObject({ method: 'POST', headers: { 'x-sveltekit-action': 'true' } });
		const rows = within(menu).getAllByRole('menuitemcheckbox');
		expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
	});

	test('a list that will not load says so in the menu; the rest still works', async () => {
		answer({ type: 'failure', data: { code: 'not_found', error: 'Gone.' } });
		const menu = await openCard(OWN);
		expect(within(menu).getByRole('alert')).toHaveTextContent(
			'Could not load your collections. Try again.'
		);
		expect(within(menu).queryByRole('menuitemcheckbox')).toBeNull();
		expect(within(menu).getByRole('menuitem', { name: 'Add to Journal' })).toBeInTheDocument();
	});

	test('the owner: collections, Add to Journal, Edit recipe, the Exports, then Move to Trash in red', async () => {
		const menu = await openCard(OWN);
		const names = EXPORT_FORMATS.map((f) => `Export ${FORMAT_LABEL[f]}`);
		expect(rowsOf(menu).map((r) => r.textContent?.trim())).toEqual([
			'To cook',
			'Quick',
			'New collection',
			'Add to Journal',
			'Edit recipe',
			...names,
			'Move to Trash'
		]);
		expect(within(menu).getByRole('menuitem', { name: 'Add to Journal' })).toHaveAttribute(
			'href',
			`/journal/new?recipe=${CARD.slug}`
		);
		expect(within(menu).getByRole('menuitem', { name: 'Edit recipe' })).toHaveAttribute(
			'href',
			`/recipes/${CARD.slug}/edit`
		);
		expect(within(menu).getByRole('menuitem', { name: names[0] })).toHaveAttribute(
			'href',
			exportHref(EXPORT_FORMATS[0], CARD.slug)
		);
		expect(within(menu).getByRole('menuitem', { name: 'Move to Trash' })).toHaveClass(
			'menu-row',
			'danger'
		);
	});

	test('a saved recipe: Fork in Edit’s place, no Export and no Trash', async () => {
		const menu = await openCard(SAVED);
		expect(rowsOf(menu).map((r) => r.textContent?.trim())).toEqual([
			'To cook',
			'Quick',
			'New collection',
			'Add to Journal',
			'Fork'
		]);
		const fork = within(menu).getByRole('menuitem', { name: 'Fork' });
		expect(fork.closest('form')).toHaveAttribute('action', `/recipes/${CARD.slug}?/fork`);
	});

	test('focus waits on a Loading collections… row, then moves to the first collection', async () => {
		let reply!: (r: { text: () => Promise<string> }) => void;
		fetchMock.mockImplementationOnce(() => new Promise((resolve) => (reply = resolve)));
		render(MoreActions, { props: OWN as never });
		await fireEvent.click(screen.getByRole('button', { name: CARD.label }));
		await tick();
		const loading = screen.getByRole('menuitem', { name: 'Loading collections…' });
		expect(loading).toHaveAttribute('aria-busy', 'true');
		expect(loading).toHaveFocus();
		reply({
			text: async () => JSON.stringify({ type: 'success', data: { collections: [TO_COOK, QUICK] } })
		});
		await vi.waitFor(() =>
			expect(screen.getByRole('menuitemcheckbox', { name: 'To cook' })).toHaveFocus()
		);
		expect(screen.queryByText('Loading collections…')).toBeNull();
	});

	test('a reader who has moved on keeps their place when the collections arrive', async () => {
		let reply!: (r: { text: () => Promise<string> }) => void;
		fetchMock.mockImplementationOnce(() => new Promise((resolve) => (reply = resolve)));
		render(MoreActions, { props: OWN as never });
		await fireEvent.click(screen.getByRole('button', { name: CARD.label }));
		await tick();
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		const journal = screen.getByRole('menuitem', { name: 'Add to Journal' });
		expect(journal).toHaveFocus();
		reply({
			text: async () => JSON.stringify({ type: 'success', data: { collections: [TO_COOK, QUICK] } })
		});
		await vi.waitFor(() => expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(2));
		expect(journal).toHaveFocus();
	});

	test('only the latest answer counts: an older one arriving late is ignored', async () => {
		const replies: ((r: { text: () => Promise<string> }) => void)[] = [];
		fetchMock.mockImplementation(() => new Promise((resolve) => replies.push(resolve)));
		render(MoreActions, { props: OWN as never });
		const trigger = screen.getByRole('button', { name: CARD.label });
		await fireEvent.click(trigger);
		await fireEvent.click(trigger);
		await fireEvent.click(trigger);
		expect(replies).toHaveLength(2);
		const send = (collections: unknown[]) => ({
			text: async () => JSON.stringify({ type: 'success', data: { collections } })
		});
		replies[1](send([TO_COOK, QUICK]));
		await vi.waitFor(() => expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(2));
		replies[0](send([{ ...QUICK, name: 'Stale' }]));
		await new Promise((r) => setTimeout(r));
		await tick();
		expect(screen.getAllByRole('menuitemcheckbox').map((r) => r.textContent?.trim())).toEqual([
			'To cook',
			'Quick'
		]);
	});

	test('a collection checked, unchecked or made tells the host; a refusal does not', async () => {
		const oncollected = vi.fn();
		const menu = await openCard({ ...OWN, oncollected });
		const quick = within(menu).getByRole('menuitemcheckbox', { name: 'Quick' });
		await settle(quick.closest('form')!, {
			type: 'failure',
			data: { code: 'invalid', error: 'No.' }
		});
		expect(oncollected).not.toHaveBeenCalled();
		await settle(quick.closest('form')!, { type: 'success' });
		expect(oncollected).toHaveBeenCalledOnce();

		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const form = screen.getByRole('textbox', { name: 'New collection' }).closest('form')!;
		await settle(form, { type: 'failure', data: { code: 'invalid', error: 'Taken.' } });
		expect(oncollected).toHaveBeenCalledOnce();
		await settle(form, { type: 'success' });
		await vi.waitFor(() => expect(oncollected).toHaveBeenCalledTimes(2));
	});

	test('Fork that cannot reach the server says nothing was forked', async () => {
		const menu = await openCard(SAVED);
		const form = within(menu).getByRole('menuitem', { name: 'Fork' }).closest('form')!;
		await settle(form, { type: 'error' });
		expect(within(menu).getByRole('alert')).toHaveTextContent(
			"Couldn't reach the server. Nothing was forked."
		);
	});

	test('Fork’s refusal is said in the menu', async () => {
		const menu = await openCard(SAVED);
		const form = within(menu).getByRole('menuitem', { name: 'Fork' }).closest('form')!;
		await settle(form, { type: 'failure', data: { code: 'unauthenticated', error: 'Log in.' } });
		expect(within(menu).getByRole('alert')).toHaveTextContent('Log in.');
	});

	test('a kept copy: collections, Add to Journal and Remove from Cookbook only', async () => {
		const menu = await openCard(KEPT);
		expect(rowsOf(menu).map((r) => r.textContent?.trim())).toEqual([
			'To cook',
			'Quick',
			'New collection',
			'Add to Journal',
			'Remove from Cookbook'
		]);
	});

	test('a press posts to the recipe’s own action and reloads nothing: the list is the menu’s', async () => {
		const menu = await openCard(OWN);
		const quick = within(menu).getByRole('menuitemcheckbox', { name: 'Quick' });
		const form = quick.closest('form')!;
		expect(form).toHaveAttribute('action', `/recipes/${CARD.slug}?/collect`);
		await fireEvent.click(quick);
		const update = await settle(form, { type: 'success' });
		expect(update).not.toHaveBeenCalled();
		expect(quick).toHaveAttribute('aria-checked', 'true');
	});

	test('a new collection is made, and the list asked for again in the menu, the page left alone', async () => {
		const menu = await openCard(OWN);
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const form = screen.getByRole('textbox', { name: 'New collection' }).closest('form')!;
		expect(form).toHaveAttribute('action', `/recipes/${CARD.slug}?/newCollection`);
		const ITALIAN = { id: 7, name: 'Italian', count: 1, has: true };
		answer({ type: 'success', data: { collections: [TO_COOK, QUICK, ITALIAN] } });
		const update = await settle(form, { type: 'success' });
		await vi.waitFor(() =>
			expect(screen.getByRole('menuitemcheckbox', { name: 'Italian' })).toHaveAttribute(
				'aria-checked',
				'true'
			)
		);
		expect(update).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(screen.queryByRole('textbox')).toBeNull();
	});

	test('a refused name says why in the menu, and is gone when the menu opens again', async () => {
		const menu = await openCard(OWN);
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'New collection' });
		await settle(box.closest('form')!, {
			type: 'failure',
			data: { code: 'invalid', error: 'Taken.' }
		});
		expect(screen.getByRole('alert')).toHaveTextContent('Taken.');
		expect(box).toHaveAttribute('aria-invalid', 'true');

		const trigger = screen.getByRole('button', { name: CARD.label });
		await fireEvent.click(trigger);
		await fireEvent.click(trigger);
		await vi.waitFor(() => expect(screen.queryByText('Loading collections…')).toBeNull());
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('Move to Trash asks in the menu with the recipe page’s sentence, then posts Delete recipe', async () => {
		const onremoved = vi.fn();
		const menu = await openCard({ ...OWN, onremoved });
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'Move to Trash' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Move Lemon Cake to Trash?' });
		expect(step).toHaveTextContent(
			`Moves Lemon Cake to your Trash. You can restore it for ${TRASH_DAYS} days.`
		);
		const form = step.closest('form')!;
		expect(form).toHaveAttribute('action', `/recipes/${CARD.slug}/edit?/deleteRecipe`);

		await settle(form, { type: 'failure', data: { code: 'not_found', error: 'Not here.' } });
		expect(screen.getByRole('alert')).toHaveTextContent('Not here.');
		expect(onremoved).not.toHaveBeenCalled();

		// The action's redirect is the move done: the card goes, the page stays.
		const update = await settle(form, { type: 'redirect' });
		expect(onremoved).toHaveBeenCalledExactlyOnceWith('trash');
		expect(update).not.toHaveBeenCalled();
	});

	test('Remove from Cookbook asks with the recipe page’s sentence and posts removeCopy', async () => {
		const onremoved = vi.fn();
		const menu = await openCard({ ...KEPT, onremoved });
		await fireEvent.click(within(menu).getByRole('menuitem', { name: 'Remove from Cookbook' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Remove your copy of Lemon Cake?' });
		expect(step).toHaveTextContent('Your copy and your note go for good.');
		const form = step.closest('form')!;
		expect(form).toHaveAttribute('action', `/recipes/${CARD.slug}?/removeCopy`);
		await settle(form, { type: 'redirect' });
		expect(onremoved).toHaveBeenCalledExactlyOnceWith('copy');
	});
});
