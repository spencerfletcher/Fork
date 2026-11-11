import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import CookbookCollections from './CookbookCollections.svelte';
import { COLLECTION_NAME_MAX } from '#lib/collections.js';

const { page } = vi.hoisted(() => ({ page: { url: new URL('http://localhost/cookbook') } }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const TO_COOK = { id: 1, name: 'To cook', count: 3 };
const QUICK = { id: 7, name: 'Quick', count: 0 };

function renderShelf(collection: { id: number; name: string } | null = null) {
	return render(CookbookCollections, {
		props: { collections: [TO_COOK, QUICK], collection }
	});
}

beforeEach(() => {
	page.url = new URL('http://localhost/cookbook?filter=mine&q=dal');
});

describe('Cookbook collections', () => {
	test('a nav of the cook’s collections with their counts, All recipes first and current', () => {
		renderShelf();
		const nav = screen.getByRole('navigation', { name: 'Collections' });
		const links = within(nav).getAllByRole('link');
		expect(links.map((l) => l.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'All recipes',
			'To cook 3',
			'Quick 0'
		]);
		expect(links[0]).toHaveAttribute('aria-current', 'page');
		expect(links[1]).not.toHaveAttribute('aria-current');
	});

	test('a collection link keeps the segment and the search; All recipes drops only the collection', () => {
		page.url = new URL('http://localhost/cookbook?filter=mine&q=dal&collection=1');
		renderShelf({ id: 1, name: 'To cook' });
		const nav = screen.getByRole('navigation', { name: 'Collections' });
		expect(within(nav).getByRole('link', { name: /^Quick/ })).toHaveAttribute(
			'href',
			'?filter=mine&q=dal&collection=7'
		);
		expect(within(nav).getByRole('link', { name: 'All recipes' })).toHaveAttribute(
			'href',
			'?filter=mine&q=dal'
		);
		expect(within(nav).getByRole('link', { name: /^To cook/ })).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	test('New collection opens a named box in place, focused, held to the name limit', async () => {
		renderShelf();
		await fireEvent.click(screen.getByRole('button', { name: 'New collection' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'Collection name' });
		expect(box).toHaveFocus();
		expect(box).toHaveAttribute('maxlength', String(COLLECTION_NAME_MAX));
		const form = box.closest('form')!;
		expect(form).toHaveAttribute('action', '?/createCollection');
		expect(within(form).getByRole('button', { name: 'Create' })).toHaveClass('btn-primary');

		await fireEvent.click(within(form).getByRole('button', { name: 'Cancel' }));
		await tick();
		expect(screen.queryByRole('textbox')).toBeNull();
		expect(screen.getByRole('button', { name: 'New collection' })).toHaveFocus();
	});

	test('the chosen collection is a heading with Rename and Delete; no heading without one', () => {
		const { unmount } = renderShelf();
		expect(screen.queryByRole('heading', { level: 2, name: 'To cook' })).toBeNull();
		unmount();

		renderShelf({ id: 1, name: 'To cook' });
		expect(screen.getByRole('heading', { level: 2, name: 'To cook' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Rename To cook' })).toHaveClass('text-btn');
		expect(screen.getByRole('button', { name: 'Delete collection' })).toHaveClass('text-btn');
	});

	test('Rename edits the name in place and posts the collection’s id', async () => {
		renderShelf({ id: 1, name: 'To cook' });
		await fireEvent.click(screen.getByRole('button', { name: 'Rename To cook' }));
		await tick();
		const box = screen.getByRole('textbox', { name: 'Collection name' });
		expect(box).toHaveValue('To cook');
		expect(box).toHaveFocus();
		const form = box.closest('form')!;
		expect(form).toHaveAttribute('action', '?/renameCollection');
		expect(form.querySelector('input[name="id"]')).toHaveValue('1');

		await fireEvent.keyDown(box, { key: 'Escape' });
		await tick();
		expect(screen.getByRole('button', { name: 'Rename To cook' })).toHaveFocus();
	});

	test('Delete is asked twice, saying the recipes stay', async () => {
		renderShelf({ id: 1, name: 'To cook' });
		await fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Delete To cook?' });
		expect(step).toHaveAccessibleDescription(
			'Only the collection goes; its recipes stay in your Cookbook.'
		);
		const form = within(step).getByRole('button', { name: 'Delete collection' }).closest('form')!;
		expect(form).toHaveAttribute('action', '?/deleteCollection');
		expect(form.querySelector('input[name="id"]')).toHaveValue('1');
	});
});
