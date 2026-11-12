import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Dropdown from './Dropdown.svelte';
import source from './Dropdown.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

// afterNavigate's callbacks are kept so a test can play a navigation back.
type Nav = { type: string; from: { url: URL }; to: { url: URL } };
const { navigated } = vi.hoisted(() => ({ navigated: [] as ((nav: Nav) => void)[] }));
vi.mock('$app/navigation', () => ({
	afterNavigate: (callback: (nav: Nav) => void) => navigated.push(callback)
}));
const nav = (type: string, from: string, to: string): Nav => ({
	type,
	from: { url: new URL(from, 'http://localhost') },
	to: { url: new URL(to, 'http://localhost') }
});

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
	test('focusOnOpen names what opening focuses, in place of the first control', async () => {
		const found = createRawSnippet(() => ({
			render: () => '<div><button type="button">First</button><input aria-label="Find" /></div>'
		}));
		render(Dropdown, {
			props: {
				trigger,
				panel: found,
				focusOnOpen: (root: HTMLElement) => root.querySelector('input')
			}
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
		expect(screen.getByRole('textbox', { name: 'Find' })).toHaveFocus();
	});

	test('from outside the items (a find box), Down goes to the first and Up to the last', async () => {
		const found = createRawSnippet(() => ({
			render: () =>
				'<div><input aria-label="Find" /><div role="menu"><a href="#a" role="menuitemradio">A</a><a href="#b" role="menuitemradio">B</a><a href="#c" role="menuitemcheckbox">C</a></div></div>'
		}));
		render(Dropdown, { props: { trigger, panel: found } });
		await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
		const box = screen.getByRole('textbox', { name: 'Find' });
		box.focus();
		await fireEvent.keyDown(box, { key: 'ArrowUp' });
		expect(screen.getByRole('menuitemcheckbox', { name: 'C' })).toHaveFocus();
		box.focus();
		await fireEvent.keyDown(box, { key: 'ArrowDown' });
		expect(screen.getByRole('menuitemradio', { name: 'A' })).toHaveFocus();
	});

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
		navigated.forEach((callback) => callback(nav('link', '/cookbook', '/recipes/dal')));
		flushSync();
		expect(screen.queryByRole('menu')).toBeNull();
	});

	test('Back within the same page closes it too', async () => {
		await renderOpen();
		navigated.forEach((callback) =>
			callback(nav('popstate', '/cookbook?filter=mine', '/cookbook'))
		);
		flushSync();
		expect(screen.queryByRole('menu')).toBeNull();
	});

	// The Cookbook reloads itself in place after a card's collection change.
	test("a host's reload of its own page (a goto to the same path) leaves it open", async () => {
		await renderOpen();
		navigated.forEach((callback) => callback(nav('goto', '/cookbook', '/cookbook?page=2')));
		flushSync();
		expect(screen.getByRole('menu')).toBeInTheDocument();
	});

	describe('with no room below', () => {
		const sheetPanel = createRawSnippet(() => ({
			render: () =>
				'<div class="menu-panel" role="menu"><button type="button" role="menuitem">Log out</button></div>'
		}));

		// The trigger 40px from the screen's foot, the panel 200px tall under it.
		function measure(panelHeight = 200) {
			const foot = window.innerHeight;
			vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
				this: HTMLElement
			) {
				const box = this.classList.contains('menu-panel')
					? { top: foot - 20, bottom: foot - 20 + panelHeight, height: panelHeight }
					: { top: foot - 40, bottom: foot - 20, height: 20 };
				return box as DOMRect;
			});
		}

		afterEach(() => vi.restoreAllMocks());

		test('it opens upward when there is room above', async () => {
			measure();
			render(Dropdown, { props: { trigger, panel: sheetPanel } });
			await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
			expect(document.querySelector('.dropdown')).toHaveClass('up');
			expect(cssRule(source, '.dropdown.up :global(.menu-panel)')).toMatch(
				/top:\s*auto;[\s\S]*bottom:\s*calc\(100% \+ 4px\)/
			);
		});

		test('it stays below when there is no room above either', async () => {
			measure(window.innerHeight);
			render(Dropdown, { props: { trigger, panel: sheetPanel } });
			await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
			expect(document.querySelector('.dropdown')).not.toHaveClass('up');
		});

		test('with room below it opens downward', async () => {
			render(Dropdown, { props: { trigger, panel: sheetPanel } });
			await fireEvent.click(screen.getByRole('button', { name: 'Your account' }));
			expect(document.querySelector('.dropdown')).not.toHaveClass('up');
		});
	});
});
