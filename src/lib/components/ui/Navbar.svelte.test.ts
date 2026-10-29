import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
import source from './Navbar.svelte?raw';
import usernameSource from './Username.svelte?raw';
import type { User } from '@supabase/supabase-js';
import { page } from '$app/state';

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Navbar', () => {
	test('shows the Log in link when user is not logged in', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getByRole('link', { name: /^log in$/i })).toBeInTheDocument();
	});

	test('shows the Sign up link when user is not logged in', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
	});

	test('does not show Log out when user is not logged in', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.queryByRole('button', { name: /log ?out/i })).not.toBeInTheDocument();
	});

	test('shows Log out, the same verb form as Log in, when logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
		expect(screen.queryByText('Logout')).toBeNull();
	});

	test('the phone menu says Log out too', async () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		await fireEvent.click(screen.getByRole('button', { name: /open main menu/i }));
		const menu = within(document.getElementById('mobile-menu')!);
		expect(menu.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
	});

	test('does not show the Log in link when logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.queryByRole('link', { name: /^log in$/i })).not.toBeInTheDocument();
	});

	test('logo links to the home page', () => {
		render(Navbar, { props: { user: null } });
		// Use getAllByRole since "Fork" also matches the CTA link text
		const links = screen.getAllByRole('link', { name: /fork/i });
		const logo = links.find((l) => l.getAttribute('href') === '/');
		expect(logo).toBeInTheDocument();
		// No stray space before the marigold stop.
		expect(screen.getByRole('link', { name: 'Fork.' })).toBe(logo);
	});

	test('on your own profile your handle in the bar is the current page', () => {
		const profile = {
			id: 'user-abc',
			username: 'chefmaria',
			avatarUrl: null,
			createdAt: new Date()
		};
		page.url = new URL('http://localhost/users/chefmaria');
		try {
			render(Navbar, { props: { user: makeUser('chef@example.com'), profile } });
			expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveAttribute(
				'aria-current',
				'page'
			);
		} finally {
			page.url = new URL('http://localhost/');
		}
	});

	test("elsewhere, and on someone else's profile, the handle is not current", () => {
		const profile = {
			id: 'user-abc',
			username: 'chefmaria',
			avatarUrl: null,
			createdAt: new Date()
		};
		page.url = new URL('http://localhost/users/someoneelse');
		try {
			render(Navbar, { props: { user: makeUser('chef@example.com'), profile } });
			expect(screen.getByRole('link', { name: '@chefmaria' })).not.toHaveAttribute('aria-current');
		} finally {
			page.url = new URL('http://localhost/');
		}
	});

	test('shows New Recipe to a signed-in user', () => {
		render(Navbar, { props: { user: { id: 'u1' } as never } });
		// Multiple links with this name exist (desktop + mobile) — just check presence
		expect(screen.getAllByRole('link', { name: /new recipe/i }).length).toBeGreaterThanOrEqual(1);
	});

	test('hides New Recipe from a logged-out visitor', () => {
		// /recipes/new redirects to /login, so offering it to a visitor sends the
		// most prominent control on the page into an auth wall.
		render(Navbar, { props: { user: null } });
		expect(screen.queryAllByRole('link', { name: /new recipe/i })).toHaveLength(0);
	});

	test('has a link to Recipes', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getAllByRole('link', { name: /^recipes$/i }).length).toBeGreaterThanOrEqual(1);
	});

	test('shows @username link to profile when logged in with profile', () => {
		const profile = {
			id: 'user-abc',
			username: 'chefmaria',
			avatarUrl: null,
			createdAt: new Date()
		};
		render(Navbar, { props: { user: makeUser('chef@example.com'), profile } });
		const link = screen.getByRole('link', { name: '@chefmaria' });
		expect(link).toHaveAttribute('href', '/users/chefmaria');
	});

	test('does not show username link when no profile', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com'), profile: null } });
		expect(screen.queryByText(/@chefmaria/)).not.toBeInTheDocument();
	});

	test('has a search icon link for the phone nav', () => {
		render(Navbar, { props: { user: null } });
		const icon = screen
			.getAllByRole('link', { name: 'Search' })
			.find((l) => l.getAttribute('aria-label') === 'Search');
		expect(icon).toHaveAttribute('href', '/search');
	});

	test('keeps Recipes current on a tag page, which is a filtered Recipes view', () => {
		page.url = new URL('http://localhost/tags/dessert');
		try {
			render(Navbar, { props: { user: null } });
			const recipes = screen.getAllByRole('link', { name: /^recipes$/i })[0];
			expect(recipes).toHaveAttribute('aria-current', 'page');
		} finally {
			page.url = new URL('http://localhost/');
		}
	});

	test('the phone menu does not repeat Search, which sits beside it as an icon', async () => {
		render(Navbar, { props: { user: null } });
		await fireEvent.click(screen.getByRole('button', { name: /open main menu/i }));
		const menu = within(document.getElementById('mobile-menu')!);
		expect(menu.queryByRole('link', { name: 'Search' })).toBeNull();
		expect(menu.getByRole('link', { name: 'Recipes' })).toBeInTheDocument();
		expect(document.querySelector('a.nav-icon')).toHaveAttribute('href', '/search');
	});

	test('the phone menu names the user the way the desktop bar does', async () => {
		const profile = {
			id: 'user-abc',
			username: 'chefmaria',
			avatarUrl: null,
			createdAt: new Date()
		};
		render(Navbar, { props: { user: makeUser('chef@example.com'), profile } });
		await fireEvent.click(screen.getByRole('button', { name: /open main menu/i }));
		const menu = within(document.getElementById('mobile-menu')!);
		expect(menu.getByRole('link', { name: '@chefmaria' })).toHaveAttribute(
			'href',
			'/users/chefmaria'
		);
		expect(menu.queryByText('chef@example.com')).toBeNull();
	});
});

// ─── Phone handle and focus ───────────────────────────────────────────────────

describe('Navbar handle', () => {
	// jsdom applies no component CSS, so the rules are read from the source.
	const style = source.slice(source.indexOf('<style>'));

	test('in the phone menu the padding is on the handle link itself, so the row is 44px', async () => {
		const profile = {
			id: 'user-abc',
			username: 'chefmaria',
			avatarUrl: null,
			createdAt: new Date()
		};
		render(Navbar, { props: { user: makeUser('chef@example.com'), profile } });
		await fireEvent.click(screen.getByRole('button', { name: /open main menu/i }));
		const handle = within(document.getElementById('mobile-menu')!).getByRole('link', {
			name: '@chefmaria'
		});
		// No padded wrapper: a padded div grows the row but not the link's hit.
		expect(handle.parentElement).not.toHaveClass('py-3');
		expect(style).toMatch(
			/\.mobile-account :global\(\.username\)\s*{[^}]*display:\s*block;[^}]*padding:\s*var\(--space-3\) var\(--space-4\)/
		);
	});

	test("the bar's marigold ring reaches the Username component's link", () => {
		// A scoped `nav :focus-visible` matches only Navbar's own elements, so the
		// handle kept the global clay ring (3.08:1 on espresso).
		expect(style).toMatch(/nav :global\(:focus-visible\)\s*{[^}]*--color-marigold/);
	});
});

// ─── Current page ─────────────────────────────────────────────────────────────

// Signed in, browse with tabs is the home page, so the nav's Recipes goes
// there and My Recipes gets its own entry (Spencer: "fine nav recipes sounds
// good"). The current link carries aria-current in the bar and the phone menu.
describe('Navbar current page', () => {
	afterEach(() => {
		page.url = new URL('http://localhost/');
	});

	async function renderAt(path: string, user: User | null) {
		page.url = new URL(`http://localhost${path}`);
		render(Navbar, { props: { user } });
		await fireEvent.click(screen.getByRole('button', { name: /open main menu/i }));
		const menu = document.getElementById('mobile-menu')!;
		// Desktop bar links are everything outside the phone menu.
		const bar = (name: string) =>
			screen.getAllByRole('link', { name }).filter((l) => !menu.contains(l));
		return { bar, menu: within(menu) };
	}

	const signedIn = () => makeUser('chef@example.com');

	test('signed in, Recipes is browse at / and My Recipes is /recipes', async () => {
		const { bar, menu } = await renderAt('/search', signedIn());
		expect(bar('Recipes')).toHaveLength(1);
		expect(bar('Recipes')[0]).toHaveAttribute('href', '/');
		expect(bar('My Recipes')[0]).toHaveAttribute('href', '/recipes');
		expect(menu.getByRole('link', { name: 'Recipes' })).toHaveAttribute('href', '/');
		expect(menu.getByRole('link', { name: 'My Recipes' })).toHaveAttribute('href', '/recipes');
	});

	test.each(['/', '/tags/dessert'])(
		'signed in on %s, Recipes is current in both lists',
		async (path) => {
			const { bar, menu } = await renderAt(path, signedIn());
			expect(bar('Recipes')[0]).toHaveAttribute('aria-current', 'page');
			expect(menu.getByRole('link', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
			expect(bar('My Recipes')[0]).not.toHaveAttribute('aria-current');
			expect(menu.getByRole('link', { name: 'My Recipes' })).not.toHaveAttribute('aria-current');
		}
	);

	test('signed in on /recipes, My Recipes is current and Recipes is not', async () => {
		const { bar, menu } = await renderAt('/recipes', signedIn());
		expect(bar('My Recipes')[0]).toHaveAttribute('aria-current', 'page');
		expect(menu.getByRole('link', { name: 'My Recipes' })).toHaveAttribute('aria-current', 'page');
		expect(bar('Recipes')[0]).not.toHaveAttribute('aria-current');
		expect(menu.getByRole('link', { name: 'Recipes' })).not.toHaveAttribute('aria-current');
	});

	test('signed out, Recipes stays /recipes, current there, with no My Recipes', async () => {
		const { bar, menu } = await renderAt('/recipes', null);
		expect(bar('Recipes')[0]).toHaveAttribute('href', '/recipes');
		expect(bar('Recipes')[0]).toHaveAttribute('aria-current', 'page');
		expect(menu.getByRole('link', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
		expect(screen.queryByRole('link', { name: 'My Recipes' })).toBeNull();
	});

	test('the search link is current on /search', async () => {
		const { bar } = await renderAt('/search', null);
		expect(bar('Search').every((l) => l.getAttribute('aria-current') === 'page')).toBe(true);
	});

	test.each([
		['/login', 'Log in', 'Sign up'],
		['/signup', 'Sign up', 'Log in']
	])('on %s, %s is current and %s is not', async (path, current, other) => {
		const { bar, menu } = await renderAt(path, null);
		expect(bar(current)[0]).toHaveAttribute('aria-current', 'page');
		expect(menu.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page');
		expect(bar(other)[0]).not.toHaveAttribute('aria-current');
		expect(menu.getByRole('link', { name: other })).not.toHaveAttribute('aria-current');
	});

	test('a current link turns cream: the style reads aria-current, not a class', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const style = source.slice(source.indexOf('<style>'));
		expect(style).toMatch(/\.navbar-link\[aria-current='page'\][^{]*{[^}]*--color-text-cream/);
		expect(style).toMatch(/\.mobile-link\[aria-current='page'\][^{]*{[^}]*--color-text-cream/);
		expect(source).not.toMatch(/class:active/);
	});

	test("the owner's handle on their own profile turns cream too", () => {
		const style = usernameSource.slice(usernameSource.indexOf('<style>'));
		expect(style).toMatch(
			/\.username\.on-dark\[aria-current='page'\][^{]*{[^}]*--color-text-cream/
		);
	});
});
