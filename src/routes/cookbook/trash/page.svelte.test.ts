import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import TrashPage from './+page.svelte';
import { TRASH_DAYS } from '#lib/trash.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const SOUP = { slug: 'soup', title: 'Soup', deleted: 'Deleted 3 days ago', left: '27 days left' };
const DAL = { slug: 'dal', title: 'Dal', deleted: 'Deleted today', left: '30 days left' };

function renderTrash(recipes: (typeof SOUP)[], form: { deleted?: string } | null = null) {
	return render(TrashPage, {
		props: { data: { recipes, meta: { title: 'Trash' } }, form } as never
	});
}

describe('Trash page', () => {
	test('leads back to the Cookbook under the Trash heading', () => {
		renderTrash([SOUP]);
		expect(screen.getByRole('heading', { level: 1, name: 'Trash' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Cookbook/ })).toHaveAttribute('href', '/cookbook');
	});

	test('an empty Trash says so, and how long a deleted recipe stays', () => {
		renderTrash([]);
		expect(screen.getByRole('heading', { name: 'Your Trash is empty' })).toBeInTheDocument();
		expect(
			screen.getByText(`Recipes you delete stay here for ${TRASH_DAYS} days, then go for good.`)
		).toBeInTheDocument();
		expect(screen.queryByRole('list')).toBeNull();
	});

	test('each row names the recipe, when it was deleted and the days left, with Restore', () => {
		renderTrash([SOUP, DAL]);
		const rows = screen.getAllByRole('listitem');
		expect(rows).toHaveLength(2);
		const soup = within(rows[0]);
		expect(soup.getByRole('heading', { name: 'Soup' })).toBeInTheDocument();
		expect(rows[0]).toHaveTextContent('Deleted 3 days ago');
		expect(rows[0]).toHaveTextContent('27 days left');

		const restore = soup.getByRole('button', { name: 'Restore Soup' });
		expect(restore).toHaveClass('text-btn');
		const form = restore.closest('form')!;
		expect(form).toHaveAttribute('action', '?/restore');
		expect(form).toHaveAttribute('method', 'POST');
		expect(form.querySelector('input[name="slug"]')).toHaveValue('soup');
	});

	test('Delete forever is asked twice in place, saying the history cannot be restored', async () => {
		renderTrash([SOUP]);
		await fireEvent.click(screen.getByRole('button', { name: 'Delete forever' }));
		await tick();
		const step = screen.getByRole('group', { name: 'Delete Soup forever?' });
		expect(step).toHaveFocus();
		expect(step).toHaveAccessibleDescription('The recipe and its history cannot be restored.');
		const confirm = within(step).getByRole('button', { name: 'Delete forever' });
		expect(confirm).toHaveAttribute('type', 'submit');
		const form = confirm.closest('form')!;
		expect(form).toHaveAttribute('action', '?/deleteForever');
		expect(form.querySelector('input[name="slug"]')).toHaveValue('soup');
		expect(within(step).getByRole('button', { name: 'Keep' })).toBeInTheDocument();
	});

	test('says which recipe was deleted forever, to a screen reader, once its row is gone', () => {
		renderTrash([], { deleted: 'Soup' });
		expect(screen.getByRole('status')).toHaveTextContent('Soup deleted forever.');
	});
});
