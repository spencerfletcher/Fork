import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { tick } from 'svelte';
import { render, screen, within, fireEvent } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
import source from './Navbar.svelte?raw';
import type { User } from '@supabase/supabase-js';
import { page } from '$app/state';
import { DESTINATIONS } from './destinations';
import { cssRule } from '#lib/testing/css.js';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/'), params: {}, route: { id: null } }
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(email: string): User {
	return {
		id: 'user-abc',
		email,
		app_metadata: {},
		user_metadata: {},
		aud: 'authenticated',
		created_at: new Date().toISOString()
	} as User;
}

const signedIn = () => makeUser('chef@example.com');
const profile = { id: 'user-abc', username: 'chefmaria', avatarUrl: null, createdAt: new Date() };
const style = source.slice(source.indexOf('<style>'));

afterEach(() => {
	page.url = new URL('http://localhost/');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Navbar', () => {
	test('the four destinations, in order', () => {
		const { container } = render(Navbar, { props: { user: signedIn(), profile } });
		const links = [...container.querySelectorAll('.navbar-links a')];
		expect(links.map((a) => a.textContent?.trim())).toEqual(DESTINATIONS.map((d) => d.label));
		expect(links.map((a) => a.getAttribute('href'))).toEqual(DESTINATIONS.map((d) => d.href));
	});

	test('the destinations show from 768 only: a phone has the tab bar', () => {
		const { container } = render(Navbar, { props: { user: null } });
		const list = container.querySelector('.navbar-links')!;
		expect(list).toHaveClass('hidden');
		expect(list).toHaveClass('md:flex');
	});

	test('there is no phone menu any more', () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
		expect(document.getElementById('mobile-menu')).toBeNull();
	});

	test.each([
		['/cookbook', 'Cookbook'],
		['/discover', 'Discover'],
		['/tags/baking', 'Discover'],
		['/journal', 'Journal']
	])('on %s, %s is the current destination', (path, label) => {
		page.url = new URL(`http://localhost${path}`);
		const { container } = render(Navbar, { props: { user: signedIn(), profile } });
		const current = [...container.querySelectorAll('.navbar-links [aria-current="page"]')];
		expect(current.map((a) => a.textContent?.trim())).toEqual([label]);
	});

	test('logo links to the home page', () => {
		render(Navbar, { props: { user: null } });
		// No stray space before the marigold stop.
		expect(screen.getByRole('link', { name: 'Fork.' })).toHaveAttribute('href', '/');
	});

	test('Search stays one tap away at every width, current on /search', () => {
		page.url = new URL('http://localhost/search');
		render(Navbar, { props: { user: null } });
		const search = screen.getByRole('link', { name: 'Search' });
		expect(search).toHaveAttribute('href', '/search');
		expect(search).toHaveAttribute('aria-current', 'page');
		expect(style).not.toMatch(/\.nav-icon\s*{[^}]*display:\s*none/);
	});
});

describe('Navbar signed out', () => {
	test('Log in and Sign up, no Log out and no New recipe', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
		expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
		expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
		expect(screen.queryByRole('link', { name: /new recipe/i })).toBeNull();
	});
});

describe('Navbar signed in', () => {
	test('New recipe, from 768: the Cookbook header carries it on a phone', () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		const cta = screen.getByRole('link', { name: '+ New recipe' });
		expect(cta).toHaveAttribute('href', '/recipes/new');
		expect(cta).toHaveClass('hidden');
		expect(cta).toHaveClass('md:inline-block');
	});

	test('New recipe is current on /recipes/new only', () => {
		page.url = new URL('http://localhost/recipes/new');
		render(Navbar, { props: { user: signedIn(), profile } });
		expect(screen.getByRole('link', { name: '+ New recipe' })).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	// The avatar alone, at every width: no handle and no Log out in the bar
	// (decided 9 November 2026). It opens a menu of Profile and Log out.
	const avatar = () => screen.getByRole('button', { name: 'Your account, @chefmaria' });

	test('the avatar is a menu button with no handle or Log out beside it', () => {
		const { container } = render(Navbar, { props: { user: signedIn(), profile } });
		const button = avatar();
		expect(button).toHaveAttribute('aria-haspopup', 'menu');
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveTextContent(/^\s*C\s*$/);
		expect(container.querySelector('nav')).not.toHaveTextContent('@chefmaria');
		expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
		expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
	});

	test('opening it shows Profile and Log out, focus on Profile', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		expect(avatar()).toHaveAttribute('aria-expanded', 'true');
		const menu = screen.getByRole('menu');
		const items = within(menu).getAllByRole('menuitem');
		expect(items.map((i) => i.textContent?.trim())).toEqual(['Profile', 'Log out']);
		expect(items[0]).toHaveAttribute('href', '/users/chefmaria');
		expect(items[0]).toHaveFocus();
		// Log out is the same real form post it was in the bar.
		expect(items[1].closest('form')).toHaveAttribute('action', '/logout');
		expect(items[1].closest('form')).toHaveAttribute('method', 'POST');
	});

	test('arrow keys move between the items', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		const [profileItem, logOut] = screen.getAllByRole('menuitem');
		await fireEvent.keyDown(profileItem, { key: 'ArrowDown' });
		expect(logOut).toHaveFocus();
		await fireEvent.keyDown(logOut, { key: 'ArrowDown' });
		expect(profileItem).toHaveFocus();
		await fireEvent.keyDown(profileItem, { key: 'ArrowUp' });
		expect(logOut).toHaveFocus();
	});

	test('Escape closes it and returns focus to the avatar', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		await fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(avatar()).toHaveAttribute('aria-expanded', 'false');
		expect(avatar()).toHaveFocus();
	});

	test('a press outside closes it', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		await fireEvent.click(screen.getByRole('link', { name: 'Fork.' }));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	test('on your own profile the avatar and Profile carry the mark; elsewhere neither does', async () => {
		page.url = new URL('http://localhost/users/chefmaria');
		const { unmount } = render(Navbar, { props: { user: signedIn(), profile } });
		expect(avatar()).toHaveClass('current');
		await fireEvent.click(avatar());
		expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		unmount();
		page.url = new URL('http://localhost/users/someone');
		render(Navbar, { props: { user: signedIn(), profile } });
		expect(avatar()).not.toHaveClass('current');
		await fireEvent.click(avatar());
		expect(screen.getByRole('menuitem', { name: 'Profile' })).not.toHaveAttribute('aria-current');
	});

	test('without a profile the menu still offers Log out', async () => {
		render(Navbar, { props: { user: signedIn() } });
		const button = screen.getByRole('button', { name: 'Your account' });
		expect(button).toHaveTextContent('C');
		await fireEvent.click(button);
		const items = screen.getAllByRole('menuitem');
		expect(items.map((i) => i.textContent?.trim())).toEqual(['Log out']);
	});
});

describe('Navbar layout', () => {
	const rule = (selector: string) => cssRule(style, selector);

	test('links and the action never wrap', () => {
		expect(rule('.navbar-link')).toMatch(/white-space:\s*nowrap/);
		expect(rule('.nav-cta')).toMatch(/white-space:\s*nowrap/);
	});

	test('the links never shrink', () => {
		const { container } = render(Navbar, { props: { user: signedIn(), profile } });
		expect(container.querySelector('.navbar-links')!.parentElement).toHaveClass('shrink-0');
	});

	// Home-screen mode has a real inset; the bar's padding runs it up behind the clock.
	test('the bar runs up behind the status bar in standalone mode', () => {
		expect(rule('nav')).toMatch(/padding-top:\s*env\(safe-area-inset-top\)/);
	});

	// Safari 26 tints the status bar from a fixed box at the viewport's top
	// edge, else from body. The strip is that box, in the bar's colour, and
	// reaches a screen up for the pull-down; it never takes a press.
	test('the status strip is fixed at the top edge in the bar colour, under the bar', () => {
		const strip = rule('.status-strip');
		expect(strip).toMatch(/position:\s*fixed/);
		expect(strip).toMatch(/top:\s*-100vh/);
		expect(strip).toMatch(/height:\s*calc\(100vh \+ 4px\)/);
		expect(strip).toMatch(/left:\s*0/);
		expect(strip).toMatch(/right:\s*0/);
		expect(strip).toMatch(/background:\s*var\(--color-navbar-bg\)/);
		expect(strip).toMatch(/pointer-events:\s*none/);
		expect(strip).toMatch(/z-index:\s*49/);
		const { container } = render(Navbar, { props: { user: null } });
		expect(container.querySelector('nav')).toHaveClass('z-50');
		expect(container.querySelector('.status-strip')).toHaveAttribute('aria-hidden', 'true');
	});

	test('the avatar is a 44px target', () => {
		expect(rule('.nav-avatar-button')).toMatch(/width:\s*44px/);
		expect(rule('.nav-avatar-button')).toMatch(/height:\s*44px/);
	});

	// Log in and the brand are thumb targets on a phone.
	test('below 768 the brand and the text links are 44px tall', () => {
		const phone = style.match(/@media \(max-width: 767px\)\s*{([\s\S]*?)\n\t}/)![1];
		const block = cssRule(phone, '.nav-brand, .navbar-link:not(.hidden)');
		expect(block).toMatch(/min-height:\s*44px/);
	});

	test("the bar's marigold ring reaches every link in it", () => {
		expect(style).toMatch(/nav :global\(:focus-visible\)\s*{[^}]*--color-marigold/);
	});

	// Current is cream against tan, which forced colours flatten; an underline
	// (an outline on the icon) keeps "you are here".
	test('the current link and icon keep a mark under forced colours', () => {
		const block = style.slice(style.lastIndexOf('@media (forced-colors: active)'));
		const link = cssRule(block, ".navbar-link[aria-current='page']");
		expect(link).toMatch(/text-decoration:\s*underline/);
		const icon = cssRule(block, ".nav-icon[aria-current='page']:not(:focus-visible)");
		expect(icon).toMatch(/outline:\s*2px solid CanvasText/);
		const avatar = cssRule(
			block,
			'.nav-avatar-button.current:not(:focus-visible) :global(.avatar)'
		);
		expect(avatar).toMatch(/outline:\s*2px solid CanvasText/);
	});
});

describe('Navbar status strip', () => {
	type Callback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting'>[]) => void;
	let observed: { callback: Callback; target?: Element; options?: IntersectionObserverInit }[];

	beforeEach(() => {
		observed = [];
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(callback: Callback, options?: IntersectionObserverInit) {
					observed.push({ callback, options });
				}
				observe(target: Element) {
					observed.at(-1)!.target = target;
				}
				disconnect() {}
			}
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('present while the bar covers the top edge, removed once it has scrolled away', async () => {
		const { container } = render(Navbar, { props: { user: null } });
		const strip = () => container.querySelector('.status-strip');

		// At rest, before the observer reports, it is there.
		expect(strip()).not.toBeNull();
		const [{ callback, target, options }] = observed;
		expect(target).toBe(container.querySelector('nav'));
		// The root loses the top 4px, so the bar must still cover the strip's 4px.
		expect(options?.rootMargin).toBe('-4px 0px 0px 0px');

		callback([{ isIntersecting: false }]);
		await tick();
		expect(strip()).toBeNull();

		callback([{ isIntersecting: true }]);
		await tick();
		expect(strip()).not.toBeNull();
	});
});
