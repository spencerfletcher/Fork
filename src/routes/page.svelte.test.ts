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

	test('"See a diff" points at the same version range as the diff rendered below it', () => {
		// A recipe with 3+ versions exposes the bug this guards against: the hero
		// used to link to v1→last regardless of which two versions the sample
		// diff below it actually shows.
		const sampleDiff = {
			recipeTitle: 'Chicken Tikka Masala',
			recipeSlug: 'chicken-tikka-masala-xyz',
			fromVersion: 2,
			toVersion: 3,
			ingredientDiff: [],
			stepDiff: [
				{
					status: 'added' as const,
					step: { step: 7, text: 'Garnish with fresh cilantro.' }
				}
			]
		};
		render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'landing', sampleDiff }
			}
		});

		const link = screen.getByRole('link', { name: /see a diff/i });
		expect(link).toHaveAttribute(
			'href',
			`/recipes/${sampleDiff.recipeSlug}/diff?from=${sampleDiff.fromVersion}&to=${sampleDiff.toVersion}`
		);
		// The diff actually on the page came from the same fromVersion/toVersion
		// pair the link points at — same object, not two independently-guessed values.
		expect(screen.getByText('Garnish with fresh cilantro.')).toBeInTheDocument();
	});
});
