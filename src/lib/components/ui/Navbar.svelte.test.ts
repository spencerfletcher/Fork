import { describe, test, expect, vi, afterEach } from 'vitest';
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
const profile = {
	id: 'user-abc',
	username: 'chefmaria',
	avatarUrl: null,
	defaultVisibility: 'private' as const,
	measurement: null,
	startersMadeAt: null,
	notificationsSeenAt: null,
	mutedNotifications: [],
	createdAt: new Date()
};

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
		expect(source).not.toMatch(/\.nav-icon\s*{[^}]*display:\s*none/);
	});

	// No count and no live region: the link's name carries it, the dot is decoration.
	test('something unseen: a dot by Friends, which the link names', () => {
		page.url = new URL('http://localhost/cookbook');
		render(Navbar, { props: { user: signedIn(), profile, unseen: true } });
		const friends = screen.getByRole('link', { name: 'Friends, new activity' });
		expect(friends.querySelector('.new-dot')).toHaveAttribute('aria-hidden', 'true');
		expect(document.querySelectorAll('.new-dot')).toHaveLength(1);
	});

	test('nothing unseen, or on Friends itself: no dot', () => {
		page.url = new URL('http://localhost/friends');
		const { unmount } = render(Navbar, { props: { user: signedIn(), profile, unseen: true } });
		expect(screen.getByRole('link', { name: 'Friends' })).toBeInTheDocument();
		expect(document.querySelector('.new-dot')).toBeNull();
		unmount();
		page.url = new URL('http://localhost/cookbook');
		render(Navbar, { props: { user: signedIn(), profile, unseen: false } });
		expect(document.querySelector('.new-dot')).toBeNull();
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
	test('New recipe, from 768: the words, marigold', () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		const cta = screen.getByRole('link', { name: '+ New recipe' });
		expect(cta).toHaveAttribute('href', '/recipes/new');
		expect(cta).toHaveClass('hidden');
		expect(cta).toHaveClass('md:inline-block');
	});

	// display:none at the other width, so a screen reader meets one of the two.
	test('below 768 a + named New recipe sits before Search, a 44px target drawn as a quiet outline', () => {
		const { container } = render(Navbar, { props: { user: signedIn(), profile } });
		const plus = screen.getByRole('link', { name: 'New recipe' });
		expect(plus).toHaveAttribute('href', '/recipes/new');
		expect(plus).toHaveClass('md:hidden');
		expect(plus.compareDocumentPosition(screen.getByRole('link', { name: 'Search' }))).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(container.querySelectorAll('a[href="/recipes/new"]')).toHaveLength(2);
		expect(cssRule(source, '.nav-plus')).toMatch(/width:\s*44px/);
		expect(cssRule(source, '.nav-plus')).toMatch(/height:\s*44px/);
		// An outline in Search's tan, cream on hover or when current: the bar's
		// one marigold is the words' button, and Journal's Add sits right under it.
		const square = cssRule(source, '.nav-plus span');
		expect(square).not.toMatch(/marigold/);
		expect(square).toMatch(/border:\s*1px solid currentColor/);
		expect(square).toMatch(/background:\s*transparent/);
		expect(cssRule(source, '.nav-plus')).toMatch(/color:\s*var\(--color-text-tan\)/);
		expect(cssRule(source, '.nav-plus:hover')).toMatch(/color:\s*var\(--color-text-cream\)/);
		expect(cssRule(source, ".nav-plus[aria-current='page']")).toMatch(
			/color:\s*var\(--color-text-cream\)/
		);
	});

	// An unlayered display on the link would beat Tailwind's layered md:hidden
	// and put a second New recipe beside the words at desktop.
	test('the + takes its display only below 768, so md:hidden hides it from 768', () => {
		const rules = source.split(/@media[^{]*\{/);
		expect(cssRule(rules[0], '.nav-plus')).not.toMatch(/display:/);
		expect(source).toMatch(/@media \(max-width: 767px\) \{\s*\.nav-plus \{\s*display: flex;/);
	});

	test('New recipe is current on /recipes/new only', () => {
		page.url = new URL('http://localhost/recipes/new');
		render(Navbar, { props: { user: signedIn(), profile } });
		expect(screen.getByRole('link', { name: '+ New recipe' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(screen.getByRole('link', { name: 'New recipe' })).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	// The avatar alone, at every width: no handle and no Log out in the bar
	// (decided 9 November 2026). It opens a menu of Profile, Settings and Log out.
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

	test('opening it shows Profile, Settings and Log out, focus on Profile', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		expect(avatar()).toHaveAttribute('aria-expanded', 'true');
		const menu = screen.getByRole('menu');
		const items = within(menu).getAllByRole('menuitem');
		expect(items.map((i) => i.textContent?.trim())).toEqual(['Profile', 'Settings', 'Log out']);
		expect(items[0]).toHaveAttribute('href', '/users/chefmaria');
		expect(items[0]).toHaveFocus();
		expect(items[1]).toHaveAttribute('href', '/settings');
		// Log out is the same real form post it was in the bar.
		expect(items[2].closest('form')).toHaveAttribute('action', '/logout');
		expect(items[2].closest('form')).toHaveAttribute('method', 'POST');
	});

	test('arrow keys move between the items', async () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		const [profileItem, settings, logOut] = screen.getAllByRole('menuitem');
		await fireEvent.keyDown(profileItem, { key: 'ArrowDown' });
		expect(settings).toHaveFocus();
		await fireEvent.keyDown(settings, { key: 'ArrowDown' });
		expect(logOut).toHaveFocus();
		await fireEvent.keyDown(logOut, { key: 'ArrowDown' });
		expect(profileItem).toHaveFocus();
		await fireEvent.keyDown(profileItem, { key: 'ArrowUp' });
		expect(logOut).toHaveFocus();
	});

	test('Settings is current on /settings only', async () => {
		page.url = new URL('http://localhost/settings');
		render(Navbar, { props: { user: signedIn(), profile } });
		await fireEvent.click(avatar());
		expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(screen.getByRole('menuitem', { name: 'Profile' })).not.toHaveAttribute('aria-current');
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

	test('without a profile the menu still offers Settings and Log out', async () => {
		render(Navbar, { props: { user: signedIn() } });
		const button = screen.getByRole('button', { name: 'Your account' });
		expect(button).toHaveTextContent('C');
		await fireEvent.click(button);
		const items = screen.getAllByRole('menuitem');
		expect(items.map((i) => i.textContent?.trim())).toEqual(['Settings', 'Log out']);
	});
});

describe('Navbar layout', () => {
	const rule = (selector: string) => cssRule(source, selector);

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

	// Safari 26 colours the status bar from the pinned box at the top edge. The
	// bar is sticky so it is that box, in a shell of its own height so it never
	// sticks.
	test('the bar is sticky inside a shell that holds nothing else', () => {
		const { container } = render(Navbar, { props: { user: null } });
		const nav = container.querySelector('nav')!;
		expect(nav).toHaveClass('sticky', 'top-0', 'z-50', 'bg-navbar-bg');
		expect(nav.parentElement).toHaveClass('nav-shell');
		expect(nav.parentElement!.children).toHaveLength(1);
		expect(container.querySelector('.status-strip')).toBeNull();
	});

	test('the avatar is a 44px target', () => {
		expect(rule('.nav-avatar-button')).toMatch(/width:\s*44px/);
		expect(rule('.nav-avatar-button')).toMatch(/height:\s*44px/);
	});

	// Log in and the brand are thumb targets on a phone.
	test('below 768 the brand and the text links are 44px tall', () => {
		const phone = source.match(/@media \(max-width: 767px\)\s*{([\s\S]*?)\n\t}/)![1];
		const block = cssRule(phone, '.nav-brand, .navbar-link:not(.hidden)');
		expect(block).toMatch(/min-height:\s*44px/);
	});

	test("the bar's marigold ring reaches every link in it", () => {
		expect(source).toMatch(/nav :global\(:focus-visible\)\s*{[^}]*--color-marigold/);
	});

	// Current is cream against tan, which forced colours flatten; an underline
	// (an outline on the icon) keeps "you are here".
	test('the current link and icon keep a mark under forced colours', () => {
		const block = source.slice(source.lastIndexOf('@media (forced-colors: active)'));
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
