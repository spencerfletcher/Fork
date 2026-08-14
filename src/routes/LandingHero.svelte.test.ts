import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LandingHero from './LandingHero.svelte';

describe('LandingHero', () => {
	test('"See a diff" links to the exact version pair passed in', () => {
		render(LandingHero, {
			props: { sampleSlug: 'classic-cookies-abc', fromVersion: 2, toVersion: 3 }
		});
		const link = screen.getByRole('link', { name: /see a diff/i });
		expect(link).toHaveAttribute('href', '/recipes/classic-cookies-abc/diff?from=2&to=3');
	});

	test('omits the diff link entirely when there is no sample recipe', () => {
		render(LandingHero, { props: {} });
		expect(screen.queryByRole('link', { name: /see a diff/i })).not.toBeInTheDocument();
	});

	test('"Browse recipes" always links to /search', () => {
		render(LandingHero, { props: {} });
		expect(screen.getByRole('link', { name: /browse recipes/i })).toHaveAttribute(
			'href',
			'/search'
		);
	});
});
