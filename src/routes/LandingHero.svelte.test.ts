import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LandingHero from './LandingHero.svelte';

describe('LandingHero', () => {
	test('"Browse recipes" always links to /search', () => {
		render(LandingHero, { props: {} });
		expect(screen.getByRole('link', { name: /browse recipes/i })).toHaveAttribute(
			'href',
			'/search'
		);
	});

	test('offers sign-up to a logged-out visitor', () => {
		render(LandingHero, { props: { isLoggedIn: false } });
		expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
	});

	test('omits sign-up when the visitor is already logged in', () => {
		// The hero is only rendered in landing mode, but a logged-in visitor can
		// still reach it, and inviting them to sign up again is nonsense.
		render(LandingHero, { props: { isLoggedIn: true } });
		expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
	});

	test('does not duplicate the diff link that sits below it', () => {
		// The hero used to carry a "See a diff" button pointing at the compare page
		// rendered a few hundred pixels lower. The signpost now lives under the
		// diff itself; the hero must not reintroduce it.
		render(LandingHero, { props: {} });
		expect(screen.queryByRole('link', { name: /see a diff/i })).not.toBeInTheDocument();
	});
});
