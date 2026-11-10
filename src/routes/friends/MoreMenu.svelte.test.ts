import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import source from './MoreMenu.svelte?raw';
import MoreMenu from './MoreMenu.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));
vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

// jsdom lays nothing out, so the offset is read from the source: the panel's
// top edge meets the ⋯ button's bottom edge, with no gap between them.
const rule = (selector: string) => source.match(new RegExp(`\\n\\t${selector} \\{([^}]*)\\}`))![1];
const px = (block: string, property: string) =>
	Number(block.match(new RegExp(`${property}: (-?\\d+)px`))![1]);

describe('MoreMenu', () => {
	test('the panel opens flush under the ⋯ button', () => {
		const button = rule('\\.more-button');
		const buttonTop = Number(button.match(/margin: (-?\d+)px/)![1]);
		expect(px(rule('\\.panel'), '--menu-top')).toBe(buttonTop + px(button, 'height'));
	});

	test('is a menu: the arrow keys walk its items, Escape hands focus back to ⋯', async () => {
		render(MoreMenu, {
			props: { userId: 'u1', username: 'devcooks', label: 'More for @devcooks' }
		});
		const more = screen.getByRole('button', { name: 'More for @devcooks' });
		expect(more).toHaveAttribute('aria-haspopup', 'menu');
		await fireEvent.click(more);

		const items = within(screen.getByRole('menu')).getAllByRole('menuitem');
		expect(items.map((i) => i.textContent?.trim())).toEqual([
			'Mute @devcooks',
			'Unfriend',
			'Report',
			'Block'
		]);
		expect(items[0]).toHaveFocus();
		await fireEvent.keyDown(items[0], { key: 'ArrowDown' });
		expect(items[1]).toHaveFocus();
		await fireEvent.keyDown(items[1], { key: 'ArrowUp' });
		await fireEvent.keyDown(items[0], { key: 'ArrowUp' });
		expect(items[3]).toHaveFocus();

		await fireEvent.keyDown(items[3], { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(more).toHaveFocus();
	});

	test('a confirm step is a form in the panel, not a menu', async () => {
		render(MoreMenu, {
			props: { userId: 'u1', username: 'devcooks', label: 'More for @devcooks' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'More for @devcooks' }));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Block' }));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(screen.getByRole('button', { name: 'Block @devcooks' })).toHaveFocus();
	});
});
