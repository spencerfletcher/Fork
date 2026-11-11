import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import CollectionChecks from './CollectionChecks.svelte';

// The ⋯ menu's use of this group is pinned through MoreActions' tests; these
// cover what select mode's bar adds: the ids on every request, and a
// collection that holds some of the selection.

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
	deserialize: (text: string) => JSON.parse(text)
}));

const ALL = { id: 5, name: 'Weeknight', has: true };
const SOME = { id: 6, name: 'Baking', has: 'mixed' as const };
const NONE = { id: 7, name: 'Soups', has: false };

const fetchMock = vi.fn();
const FIELDS = { ids: '3,5,8' };

async function settle(form: HTMLFormElement, result: Result) {
	const formData = new FormData(form);
	const handler = await submits.get(form)!({ formElement: form, formData, cancel: () => {} });
	await handler({ result, update: async () => {} });
	await tick();
	return formData;
}

async function renderGroup(oncollected = vi.fn()) {
	render(CollectionChecks, {
		props: {
			collections: 'on-open',
			listAction: '/cookbook?/bulkCollections',
			collectAction: '/cookbook?/bulkCollect',
			newAction: '/cookbook?/bulkNewCollection',
			fields: FIELDS,
			oncollected
		}
	});
	await vi.waitFor(() => expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(3));
	return oncollected;
}

const row = (name: string) => screen.getByRole('menuitemcheckbox', { name });

describe('Collections for a selection', () => {
	beforeEach(() => {
		submits.clear();
		fetchMock.mockReset();
		fetchMock.mockResolvedValue({
			text: async () =>
				JSON.stringify({ type: 'success', data: { collections: [ALL, SOME, NONE] } })
		});
		vi.stubGlobal('fetch', fetchMock);
	});

	test('the list is asked for with the selection, each row all, some (mixed) or none', async () => {
		await renderGroup();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/cookbook?/bulkCollections');
		expect(Object.fromEntries(init.body as FormData)).toEqual(FIELDS);
		expect(row('Weeknight')).toHaveAttribute('aria-checked', 'true');
		expect(row('Baking')).toHaveAttribute('aria-checked', 'mixed');
		expect(row('Soups')).toHaveAttribute('aria-checked', 'false');
	});

	test('a mixed row pressed puts them all in; refused, it is mixed again', async () => {
		await renderGroup();
		const form = row('Baking').closest('form')!;
		expect(form).toHaveAttribute('action', '/cookbook?/bulkCollect');

		await fireEvent.click(row('Baking'));
		const sent = await settle(form, { type: 'failure', data: { code: 'invalid', error: 'No.' } });
		expect(Object.fromEntries(sent)).toEqual({ ...FIELDS, collectionId: '6', member: '1' });
		expect(row('Baking')).toHaveAttribute('aria-checked', 'mixed');
	});

	test('a press the server took tells the host which collection, in or out, and its answer', async () => {
		const oncollected = await renderGroup();
		const data = { collected: 5, changed: 3, skipped: 0 };
		await fireEvent.click(row('Weeknight'));
		const sent = await settle(row('Weeknight').closest('form')!, { type: 'success', data });
		expect(sent.get('member')).toBe('0');
		expect(oncollected).toHaveBeenCalledWith({ name: 'Weeknight', member: false, data });
		expect(row('Weeknight')).toHaveAttribute('aria-checked', 'false');
	});

	test('a new collection carries the selection, and is made with all of it in', async () => {
		const oncollected = await renderGroup();
		await fireEvent.click(screen.getByRole('menuitem', { name: 'New collection' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'New collection' });
		await fireEvent.input(box, { target: { value: ' Sunday ' } });
		const form = box.closest('form')!;
		expect(form).toHaveAttribute('action', '/cookbook?/bulkNewCollection');

		const data = { collected: 9, changed: 3, skipped: 0 };
		const sent = await settle(form, { type: 'success', data });
		expect(sent.get('ids')).toBe(FIELDS.ids);
		await vi.waitFor(() =>
			expect(oncollected).toHaveBeenCalledWith({ name: 'Sunday', member: true, data })
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
