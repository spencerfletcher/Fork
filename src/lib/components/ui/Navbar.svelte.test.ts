import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
import source from './Navbar.svelte?raw';
import type { User } from '@supabase/supabase-js';
import { page } from '$app/state';
import { DESTINATIONS } from './destinations';

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

	test('the avatar and handle are one link to your profile', () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		const link = screen.getByRole('link', { name: '@chefmaria, your profile' });
		expect(link).toHaveAttribute('href', '/users/chefmaria');
		expect(within(link).getByText('C')).toHaveClass('nav-avatar');
		expect(link).toHaveTextContent('@chefmaria');
		expect(link).toHaveAttribute('title', '@chefmaria');
	});

	test('on your own profile the profile link is the current page; elsewhere it is not', () => {
		page.url = new URL('http://localhost/users/chefmaria');
		const { unmount } = render(Navbar, { props: { user: signedIn(), profile } });
		expect(screen.getByRole('link', { name: /your profile/ })).toHaveAttribute(
			'aria-current',
			'page'
		);
		unmount();
		page.url = new URL('http://localhost/users/someone');
		render(Navbar, { props: { user: signedIn(), profile } });
		expect(screen.getByRole('link', { name: /your profile/ })).not.toHaveAttribute('aria-current');
	});

	test('no profile link without a profile', () => {
		render(Navbar, { props: { user: signedIn() } });
		expect(screen.queryByRole('link', { name: /your profile/ })).toBeNull();
	});

	test('Log out, the same verb form as Log in, a real form post', () => {
		render(Navbar, { props: { user: signedIn(), profile } });
		const button = screen.getByRole('button', { name: 'Log out' });
		expect(button.closest('form')).toHaveAttribute('action', '/logout');
		expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
	});
});

describe('Navbar layout', () => {
	const rule = (selector: string) => style.match(new RegExp(`${selector}\\s*{([^}]*)}`))![1];

	test('links, Log out and the action never wrap', () => {
		expect(rule('\\.navbar-link')).toMatch(/white-space:\s*nowrap/);
		expect(rule('\\.nav-cta')).toMatch(/white-space:\s*nowrap/);
	});

	test('only the handle gives way when the bar is full: the links never shrink', () => {
		const long = { ...profile, username: 'a'.repeat(30) };
		const { container } = render(Navbar, { props: { user: signedIn(), profile: long } });
		expect(container.querySelector('.navbar-links')!.parentElement).toHaveClass('shrink-0');
		const account = container.querySelector('.navbar-account')!;
		expect(account).toHaveClass('min-w-0');
		expect(account).toHaveClass('shrink');
		expect(rule('\\.nav-handle')).toMatch(/text-overflow:\s*ellipsis/);
	});

	test("the bar's marigold ring reaches every link in it", () => {
		expect(style).toMatch(/nav :global\(:focus-visible\)\s*{[^}]*--color-marigold/);
	});

	// Current is cream against tan, which forced colours flatten; an underline
	// (an outline on the icon) keeps "you are here".
	test('the current link and icon keep a mark under forced colours', () => {
		const block = style.slice(style.lastIndexOf('@media (forced-colors: active)'));
		const link = block.match(/\.navbar-link\[aria-current='page'\][^{]*{([^}]*)}/)![1];
		expect(link).toMatch(/text-decoration:\s*underline/);
		const icon = block.match(/\.nav-icon\[aria-current='page'\][^{]*{([^}]*)}/)![1];
		expect(icon).toMatch(/outline:\s*2px solid CanvasText/);
	});
});
