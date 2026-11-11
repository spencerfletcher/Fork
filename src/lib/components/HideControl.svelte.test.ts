import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import HideControl from './HideControl.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

describe('HideControl', () => {
	test('a shown recipe offers Hide from others, asked twice, posting to its own page’s hide', async () => {
		render(HideControl, { props: { slug: 'soup', title: 'Soup', hidden: false } });
		expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Hide from others' }));
		const step = screen.getByRole('group', { name: 'Hide Soup from other cooks?' });
		const confirm = screen.getByRole('button', { name: 'Hide' });
		expect(step.contains(confirm)).toBe(true);
		expect(confirm.closest('form')).toHaveAttribute('action', '/recipes/soup?/hide');
	});

	test('a hidden recipe offers Restore at once, posting to its own page’s unhide', () => {
		render(HideControl, { props: { slug: 'soup', title: 'Soup', hidden: true } });
		expect(screen.queryByRole('button', { name: 'Hide from others' })).toBeNull();
		const restore = screen.getByRole('button', { name: 'Restore Soup for other cooks' });
		expect(restore.closest('form')).toHaveAttribute('action', '/recipes/soup?/unhide');
		expect(restore.closest('form')).toHaveAttribute('method', 'POST');
	});
});
