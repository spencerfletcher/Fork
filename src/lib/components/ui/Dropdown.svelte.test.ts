import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Dropdown from './Dropdown.svelte';

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

	test('a navigation closes the menu', async () => {
		await renderOpen();
		expect(screen.getByRole('menu')).toBeInTheDocument();
		navigated.forEach((callback) => callback());
		flushSync();
		expect(screen.queryByRole('menu')).toBeNull();
	});
});
