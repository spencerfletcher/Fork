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

	test('shows user email when logged in', () => {
		render(Navbar, { props: { user: makeUser('chef@example.com') } });
		expect(screen.getAllByText('chef@example.com').length).toBeGreaterThanOrEqual(1);
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
		const logo = screen.getByRole('link', { name: /recipebook/i });
		expect(logo).toHaveAttribute('href', '/');
	});

	test('has a link to New Recipe', () => {
		render(Navbar, { props: { user: null } });
		// Multiple links with this name exist (desktop + mobile) — just check presence
		expect(screen.getAllByRole('link', { name: /new recipe/i }).length).toBeGreaterThanOrEqual(1);
	});

	test('has a link to Recipes', () => {
		render(Navbar, { props: { user: null } });
		expect(screen.getAllByRole('link', { name: /^recipes$/i }).length).toBeGreaterThanOrEqual(1);
	});
});
