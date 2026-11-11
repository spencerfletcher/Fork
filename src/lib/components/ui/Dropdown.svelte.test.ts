import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Dropdown from './Dropdown.svelte';
import source from './Dropdown.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

// afterNavigate's callbacks are kept so a test can play a navigation back.
const { navigated } = vi.hoisted(() => ({ navigated: [] as (() => void)[] }));
vi.mock('$app/navigation', () => ({
	afterNavigate: (callback: () => void) => navigated.push(callback)
}));

type TriggerProps = { 'aria-expanded': boolean; onclick: (e: MouseEvent) => void };

const trigger = createRawSnippet((props: () => TriggerProps) => ({
	render: () => '<button type="button">Your account</button>',
	setup(node: Element) {
		node.addEventListener('click', (e) => props().onclick(e as MouseEvent));
	}
}));

// A link that goes nowhere, so jsdom's click stays on this page.
const panel = createRawSnippet(() => ({
	render: () =>
		'<div role="menu"><a href="#profile" role="menuitem">Profile</a><button type="button" role="menuitem">Log out</button></div>'
}));

function renderOpen() {
	render(Dropdown, { props: { trigger, panel } });
	return fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
}

describe('Dropdown', () => {
	test('the arrow keys walk every item, checkable ones included, wrapping at the ends', async () => {
		const checks = createRawSnippet(() => ({
			render: () =>
				'<div role="menu"><button type="button" role="menuitemcheckbox" aria-checked="true">To cook</button><button type="button" role="menuitem">New collection</button></div>'
		}));
		render(Dropdown, { props: { trigger, panel: checks } });
		await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
		const first = screen.getByRole('menuitemcheckbox', { name: 'To cook' });
		first.focus();
		await fireEvent.keyDown(first, { key: 'ArrowDown' });
		expect(screen.getByRole('menuitem', { name: 'New collection' })).toHaveFocus();
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		expect(first).toHaveFocus();
	});

	test('a press on a menu link closes the menu at once, before the new page paints', async () => {
		await renderOpen();
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Profile' }));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	test('a press on a menu button leaves the panel for its form to submit', async () => {
		await renderOpen();
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
		expect(screen.getByRole('menu')).toBeInTheDocument();
	});

	// 4A softened (Spencer, 11 November 2026): the page's paper, a 1px Ink 2
	// edge one step lighter than the text, the band under a hovered row, and
	// no shadow. The edge is a real border, so forced colours keep it.
	test('the panel is paper with an Ink 2 edge and no shadow; a row hovers to the band', () => {
		const panel = cssRule(source, '.dropdown :global(.menu-panel)');
		expect(panel).toMatch(/background:\s*var\(--color-bg\)/);
		expect(panel).toMatch(/border:\s*1px solid var\(--color-text-2\)/);
		expect(source).not.toMatch(/box-shadow/);
		expect(cssRule(source, '.dropdown :global(.menu-row:hover)')).toMatch(
			/background:\s*var\(--color-band\)/
		);
	});

	test('a navigation closes the menu', async () => {
		await renderOpen();
		expect(screen.getByRole('menu')).toBeInTheDocument();
		navigated.forEach((callback) => callback());
		flushSync();
		expect(screen.queryByRole('menu')).toBeNull();
	});
});
