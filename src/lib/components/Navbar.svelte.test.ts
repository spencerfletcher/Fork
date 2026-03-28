import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import Navbar from './Navbar.svelte';
import type { User } from '@supabase/supabase-js';

vi.mock('$app/stores', () => ({
	page: readable({ url: new URL('http://localhost/'), params: {}, route: { id: null } })
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
	test('shows Login link when user is not logged in', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
	});

	test('shows Sign Up link when user is not logged in', () => {
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

	test('does not show Login link when logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
	});

	test('logo links to the home page', () => {
		render(Navbar, { props: { user: null } });
		// Use getAllByRole since "Fork" also matches the CTA link text
		const links = screen.getAllByRole('link', { name: /fork/i });
		const logo = links.find((l) => l.getAttribute('href') === '/');
		expect(logo).toBeInTheDocument();
	});

	test('has a link to Fork recipe', () => {
		render(Navbar, { props: { user: null } });
		// Multiple links with this name exist (desktop + mobile) — just check presence
		expect(screen.getAllByRole('link', { name: /fork recipe/i }).length).toBeGreaterThanOrEqual(1);
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
});
