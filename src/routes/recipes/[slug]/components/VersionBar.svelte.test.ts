import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import VersionBar from './VersionBar.svelte';
import source from './VersionBar.svelte?raw';
import type { ComponentProps } from 'svelte';
import { makeVersion } from '#lib/recipes/fixtures.js';

vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

type Props = ComponentProps<typeof VersionBar>;

/** The bar line's parts in reading order. */
const order = (current: Element) =>
	[...current.children].map((el) =>
		['version-number', 'message', 'controls'].find((c) => el.classList.contains(c))
	);

const THREE = [
	makeVersion(3, 'Chill the dough'),
	makeVersion(2, 'Add espresso powder'),
	makeVersion(1, 'Initial recipe')
];

function renderBar(overrides: Partial<Props> = {}) {
	return render(VersionBar, {
		props: {
			recipe: { slug: 'my-fork' },
			currentVersion: THREE[0],
			versions: THREE,
			isViewingHistory: false,
			...overrides
		}
	});
}

describe('VersionBar', () => {
	test('a recipe with one version has no bar at all', () => {
		const { container } = renderBar({
			currentVersion: THREE[2],
			versions: [THREE[2]]
		});
		expect(container.querySelector('.version-bar')).toBeNull();
	});

	test('the latest version, closed: number, message and the toggle, no compare', () => {
		const { container } = renderBar();
		expect(container.querySelector('.version-bar')).toHaveAttribute(
			'aria-label',
			'Version history'
		);
		const current = container.querySelector('.version-bar .current')!;
		expect(current.querySelector('.version-number')).toHaveTextContent('v3');
		// A full stop, so a screen reader pauses before the note.
		expect(current.querySelector('.version-number .sr-only')).toHaveTextContent(
			/^Version 3, the latest\.$/
		);

		expect(current.querySelector('.message')).toHaveTextContent('Chill the dough');
		expect(current.querySelector('.message')).toHaveClass('clamped');
		const toggle = screen.getByRole('button', { name: '3 versions' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(toggle).toHaveAttribute('aria-controls', 'version-history');
		expect(screen.queryByRole('link', { name: 'Compare with v2' })).toBeNull();
		expect(screen.getByText('Add espresso powder')).not.toBeVisible();
		expect(screen.queryByText(/older version/i)).toBeNull();
		// The latest reads its note first, then the toggle.
		expect(order(current)).toEqual(['version-number', 'message', 'controls']);
	});

	test('opening lists the other versions as row links, each comparing with this one, and unclamps the message', async () => {
		const { container } = renderBar();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(screen.getByRole('button', { name: '3 versions' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect(container.querySelector('.version-bar .current .message')).not.toHaveClass('clamped');
		// The current line never carries a compare: each other row compares with it.
		expect(container.querySelector('.version-bar .current .compare')).toBeNull();
		expect(container.querySelectorAll('#version-history li')).toHaveLength(2);
		expect(screen.getByRole('link', { name: 'v2 Add espresso powder' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=2'
		);
		expect(screen.getByRole('link', { name: 'v1 Initial recipe' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=1'
		);
		const compares = screen.getAllByRole('link', { name: 'Compare with v3' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=3'
		]);
	});

	test('Escape closes the list and puts focus back on the toggle, but only from inside the bar', async () => {
		renderBar();
		const toggle = screen.getByRole('button', { name: '3 versions' });
		await fireEvent.click(toggle);
		expect(screen.getByText('Initial recipe')).toBeVisible();
		// Focus elsewhere on the page: Escape is not the bar's to take.
		const outside = document.createElement('button');
		document.body.append(outside);
		outside.focus();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByText('Initial recipe')).toBeVisible();
		expect(outside).toHaveFocus();
		outside.remove();
		toggle.focus();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		expect(toggle).toHaveFocus();
	});

	test('an older version says so and offers the way back; the rows compare with it', async () => {
		const { container } = renderBar({ currentVersion: THREE[1], isViewingHistory: true });
		const current = container.querySelector('.version-bar .current')!;
		expect(current.querySelector('.version-number')).toHaveTextContent('v2');
		expect(current.querySelector('.version-number .sr-only')).toHaveTextContent(
			/^Version 2 of 3, an older version\.$/
		);

		// No "Older version" label (Spencer, 29 October 2026): the chip's spoken
		// text says it and "Back to v3" is clue enough. Chip, note, then the
		// controls at the right end, where the latest keeps its toggle.
		expect(order(current)).toEqual(['version-number', 'message', 'controls']);
		expect(current.querySelector('.state')).toBeNull();
		expect(current).not.toHaveTextContent('Older version');
		expect(screen.getByRole('link', { name: 'Back to v3' })).toHaveAttribute(
			'href',
			'/recipes/my-fork'
		);
		// The separators are drawn by CSS between items, never typed, so no
		// wrapped line can start or end with one.
		expect(current.querySelectorAll('.controls .item')).toHaveLength(2);
		expect(current.querySelector('.controls')!.textContent).not.toContain('·');
		// A phone keeps the dot too, or "Back to v3" and "3 versions" read as one
		// phrase. jsdom applies no component CSS, so the rule is read from the source.
		expect(source).toMatch(/\.item \+ \.item::before \{\s*content: '· ';/);
		expect(source).not.toMatch(/\.item \+ \.item::before \{\s*content: none;/);

		expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		// v3's row compares with v2, the one being read; v2's own line still has none.
		expect(screen.queryByRole('link', { name: 'Compare with v3' })).toBeNull();
		expect(container.querySelector('.version-bar .current .compare')).toBeNull();
		expect(container.querySelectorAll('#version-history li')).toHaveLength(2);
		const compares = screen.getAllByRole('link', { name: 'Compare with v2' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=2'
		]);
	});

	test('closed, a click anywhere on the bar opens the list; the toggle still flips it once', async () => {
		const { container } = renderBar();
		const toggle = screen.getByRole('button', { name: '3 versions' });
		await fireEvent.click(container.querySelector('.version-bar .current .message')!);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		// Open, the bar is not a close target: only the toggle closes it.
		await fireEvent.click(container.querySelector('.version-bar .current .message')!);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		// The toggle's own click bubbles to the bar and must not fire twice.
		await fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
	});

	test("the header's version count lands on the bar as #versions and opens its list", async () => {
		const { container } = renderBar();
		expect(container.querySelector('.version-bar')).toHaveAttribute('id', 'versions');
		const toggle = screen.getByRole('button', { name: '3 versions' });
		window.location.hash = '#elsewhere';
		await fireEvent(window, new HashChangeEvent('hashchange'));
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		window.location.hash = '#versions';
		await fireEvent(window, new HashChangeEvent('hashchange'));
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		window.location.hash = '';
	});

	test('closed, a click on a link inside the bar does not open the list', async () => {
		renderBar({ currentVersion: THREE[1], isViewingHistory: true });
		const back = screen.getByRole('link', { name: 'Back to v3' });
		back.addEventListener('click', (e) => e.preventDefault());
		await fireEvent.click(back);
		expect(screen.getByRole('button', { name: '3 versions' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});

	test('closed, the bar shows the pointer; open, it does not', async () => {
		const { container } = renderBar();
		const bar = container.querySelector('.version-bar')!;
		expect(bar).toHaveClass('closed');
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(bar).not.toHaveClass('closed');
		expect(source).toMatch(/\.version-bar\.closed \{[^}]*cursor: pointer;/);
	});

	test("hover and focus outline each other version's row in Ink 2, never the current line", () => {
		// jsdom applies no component CSS, so the rule is read from the source. The
		// list holds only the other versions; the current line lives in .current.
		const style = source.slice(source.indexOf('<style>'));
		const rule = /\.history li:hover,\s*\.history li:focus-within \{([^}]*)\}/.exec(style);
		expect(rule).not.toBeNull();
		expect(rule![1]).toMatch(/outline: 1px solid var\(--color-text-2\);/);
		expect(rule![1]).toMatch(/outline-offset: -1px;/);
		expect(style).not.toMatch(/\.current[^{]*:hover[^{]*\{[^}]*outline/);
		expect(style).toMatch(
			/@media \(forced-colors: active\) \{\s*\.history li:hover,\s*\.history li:focus-within \{\s*outline-color: CanvasText;/
		);
	});

	test('the chip keeps its box in forced colours: a transparent outline, inset so nothing moves', () => {
		// Forced colours drop the marigold fill but draw the outline in the text colour.
		const chip = /\.current \.version-number \{([^}]*)\}/.exec(source)![1];
		expect(chip).toMatch(/outline: 1px solid transparent;/);
		expect(chip).toMatch(/outline-offset: -1px;/);
		expect(chip).not.toMatch(/border:|margin/);
	});

	test('the toggle grows its hit on a pseudo, so its focus ring hugs the words', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const style = source.slice(source.indexOf('<style>'));
		const padded = [...style.matchAll(/([^{}]*)\{[^}]*padding: (?:4|11)px 0;[^}]*\}/g)].map(
			(m) => m[1]
		);
		for (const selectors of padded) expect(selectors).not.toMatch(/\.versions-toggle\b(?!::)/);
		expect(style).toMatch(/\.versions-toggle \{[^}]*position: relative;/);
		expect(style).toMatch(/\.versions-toggle::before \{[^}]*content: '';[^}]*inset: -4px 0;/);
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
		expect(phone).toMatch(/\.versions-toggle::before \{\s*inset: -11px 0;/);
	});
});
