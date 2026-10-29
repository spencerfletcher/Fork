import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
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

	test('does not show Logout button when user is not logged in', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
	});

	test('shows Logout button when user is logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
	});

	test('shows Logout button when logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
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

	test('keeps Recipes highlighted on a tag page, which is a filtered Recipes view', () => {
		page.url = new URL('http://localhost/tags/dessert');
		try {
			render(Navbar, { props: { user: null } });
			const recipes = screen.getAllByRole('link', { name: /^recipes$/i })[0];
			expect(recipes).toHaveClass('active');
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
