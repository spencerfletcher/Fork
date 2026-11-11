import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import TabBar from './TabBar.svelte';
import source from './TabBar.svelte?raw';
import { DESTINATIONS } from './destinations';
import { cssRule } from '#lib/testing/css.js';

const { page } = vi.hoisted(() => ({
	page: { url: new URL('http://localhost/cookbook'), route: { id: '/cookbook' as string | null } }
}));
vi.mock('$app/state', () => ({ page }));

const at = (path: string, routeId: string | null) => {
	page.url = new URL(`http://localhost${path}`);
	page.route = { id: routeId };
};

beforeEach(() => at('/cookbook', '/cookbook'));

describe('TabBar', () => {
	test('the four destinations, in order, as links', () => {
		render(TabBar);
		const bar = screen.getByRole('navigation', { name: 'Main' });
		const links = within(bar).getAllByRole('link');
		expect(links.map((a) => a.textContent?.trim())).toEqual(DESTINATIONS.map((d) => d.label));
		expect(links.map((a) => a.getAttribute('href'))).toEqual(DESTINATIONS.map((d) => d.href));
	});

	test('the current destination is marked, and only it', () => {
		at('/friends', '/friends');
		render(TabBar);
		const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current'));
		expect(current.map((a) => a.textContent?.trim())).toEqual(['Friends']);
		expect(current[0]).toHaveAttribute('aria-current', 'page');
	});

	// One Journal drawing (2B, 11 November 2026): the tab draws Add to Journal's
	// notepad from Icons.svelte, not a calendar of its own.
	test('Journal draws the shared journal icon', () => {
		render(TabBar);
		const svg = screen.getByRole('link', { name: 'Journal' }).querySelector('svg')!;
		expect(source).toMatch(/\{@render journalIcon\(24\)\}/);
		expect(svg.querySelector('rect')).not.toBeNull();
		expect(svg.querySelector('path')!.getAttribute('d')).toMatch(/^M8 3v4M12 3v4M16 3v4/);
	});

	test('Cook hides it', () => {
		at('/recipes/dal?cook=1', '/recipes/[slug]');
		render(TabBar);
		expect(screen.queryByRole('navigation')).toBeNull();
	});

	test('a recipe outside Cook keeps it', () => {
		at('/recipes/dal', '/recipes/[slug]');
		render(TabBar);
		expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
	});

	test('the editor hides it, new and edit', () => {
		for (const [path, id] of [
			['/recipes/new', '/recipes/new'],
			['/recipes/dal/edit', '/recipes/[slug]/edit']
		]) {
			at(path, id);
			const { unmount } = render(TabBar);
			expect(screen.queryByRole('navigation')).toBeNull();
			unmount();
		}
	});

	// Paper, not white (white is the version bar's), a Rule 2 line above, a clay
	// top edge on the current item, 44px+ targets, clear of the home indicator.
	test('paper with a rule above, clay edge on the current item, 44px targets, safe area', () => {
		expect(source).toMatch(/background:\s*var\(--color-bg\)/);
		expect(source).toMatch(/border-top:\s*1px solid var\(--color-border-2\)/);
		expect(source).toMatch(
			/\[aria-current='page'\][^}]*border-top-color:\s*var\(--color-accent\)/s
		);
		expect(source).toMatch(/min-height:\s*56px/);
		expect(source).toContain('env(safe-area-inset-bottom)');
	});

	test('hover: ink on the band', () => {
		const hover = cssRule(source, '.tab-bar a:hover');
		expect(hover).toMatch(/color:\s*var\(--color-text\)/);
		expect(hover).toMatch(/background:\s*var\(--color-band\)/);
	});

	test('below 768 only', () => {
		expect(source).toMatch(/@media \(min-width: 768px\)\s*\{\s*\.tab-bar\s*\{\s*display:\s*none/);
	});

	// In the component, not app.css: a layered rule there loses to this unlayered one.
	test("gives way to the Cookbook's select bar", () => {
		expect(cssRule(source, ':global(body:has(.select-bar)) .tab-bar')).toMatch(/display:\s*none/);
	});
});
