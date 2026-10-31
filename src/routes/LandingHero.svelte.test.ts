import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LandingHero from './LandingHero.svelte';

describe('LandingHero', () => {
	test('"Browse recipes" links to the browse page, not an empty search form', () => {
		render(LandingHero, { props: {} });
		expect(screen.getByRole('link', { name: /browse recipes/i })).toHaveAttribute(
			'href',
			'/recipes'
		);
	});

	test('offers sign-up to a logged-out visitor', () => {
		render(LandingHero, { props: {} });
		expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
	});

	test('does not duplicate the diff link that sits below it', () => {
		// The hero used to carry a "See a diff" button pointing at the compare page
		// rendered a few hundred pixels lower. The signpost now lives under the
		// diff itself; the hero must not reintroduce it.
		render(LandingHero, { props: {} });
		expect(screen.queryByRole('link', { name: /see a diff/i })).not.toBeInTheDocument();
	});

	test('leads with the cooking benefit in plain words, and says what a fork is', () => {
		// A first-time visitor need not know git (Spencer, 31 October 2026).
		const { container } = render(LandingHero, { props: {} });
		const copy = container.textContent ?? '';
		expect(copy).not.toMatch(/commit|diff|version control|git/i);
		expect(screen.getByText(/^Fork someone.s recipe/)).toHaveTextContent(/copy/);
		expect(screen.getByText(/^Fork someone.s recipe/)).toHaveTextContent(/credits/);
	});
});
