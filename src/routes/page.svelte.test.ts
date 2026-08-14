import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	test('renders the site heading', () => {
		render(Page, {
			props: { data: { recipes: [], user: null, profile: null, mode: 'feed', sampleDiff: null } }
		});
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	test('landing mode renders exactly one h1, and it is the hero headline', () => {
		// The feed heading is demoted to h2 in landing mode so the page has
		// exactly one h1 — the hero's. That fix had no test at any level.
		render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'landing', sampleDiff: null }
			}
		});
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings).toHaveLength(1);
		expect(headings[0]).toHaveTextContent('Recipes, under version control.');
	});

	test('feed mode renders no LandingHero', () => {
		render(Page, {
			props: { data: { recipes: [], user: null, profile: null, mode: 'feed', sampleDiff: null } }
		});
		expect(screen.queryByText('Recipes, under version control.')).not.toBeInTheDocument();
	});
});
