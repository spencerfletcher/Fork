import { describe, test, expect, vi } from 'vitest';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import source from './MoreMenu.svelte?raw';
import MoreMenu from './MoreMenu.svelte';
import { cssRule } from '#lib/testing/css.js';
import { readFileSync } from 'node:fs';

// Each form's enhance callback is kept by its action, so a test can play back a result.
const { submits } = vi.hoisted(() => ({ submits: new Map<string, SubmitFunction>() }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: SubmitFunction) => {
		submits.set(form.getAttribute('action')!, submit);
		return { destroy: () => {} };
	}
}));
vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

// jsdom lays nothing out, so the offset is read from the source: the panel's
// top edge meets the ⋯ button's bottom edge, with no gap between them.
const rule = (selector: string) => cssRule(source, selector);
const px = (block: string, property: string) =>
	Number(block.match(new RegExp(`${property}: (-?\\d+)px`))![1]);

describe('MoreMenu', () => {
	test('the panel opens flush under the ⋯ button', () => {
		// The margin is the feed's; the 44px square is app.css's shared trigger.
		const buttonTop = Number(rule('.more-button').match(/margin: (-?\d+)px/)![1]);
		const height = px(cssRule(readFileSync('src/app.css', 'utf8'), '.more-button'), 'height');
		expect(px(rule('.panel'), '--menu-top')).toBe(buttonTop + height);
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
		// The row is a flex box, which would drop the space between two of its
		// children ("Mute@devcooks"), so the words are one child.
		expect(items[0].children).toHaveLength(1);
		expect(items[0].children[0].textContent?.trim()).toBe('Mute @devcooks');
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

	test('the handle is mono through .handle, in the row’s own colour, and the names are unchanged', async () => {
		render(MoreMenu, {
			props: { userId: 'u1', username: 'devcooks', label: 'More for @devcooks' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'More for @devcooks' }));
		const mute = screen.getByRole('menuitem', { name: 'Mute @devcooks' });
		expect(mute.querySelector('.handle')).toHaveTextContent(/^@devcooks$/);

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Block' }));
		const block = screen.getByRole('button', { name: 'Block @devcooks' });
		expect(block.querySelector('.handle')).toHaveTextContent(/^@devcooks$/);
		// Clay is .handle's own colour; here the row's (ink, or danger) carries it.
		expect(rule('.handle')).toContain('color: inherit');
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

	test('a signed-out Mute says the session ended, in the panel', async () => {
		render(MoreMenu, {
			props: { userId: 'u1', username: 'devcooks', label: 'More for @devcooks' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'More for @devcooks' }));
		const words = SESSION_ENDED('try again');
		const after = await (
			submits.get('/friends?/mute') as unknown as () => Promise<
				(opts: { result: unknown; update: () => Promise<void> }) => Promise<void>
			>
		)();
		await after({
			result: { type: 'failure', status: 401, data: { error: words } },
			update: async () => {}
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent(words);
	});
});
