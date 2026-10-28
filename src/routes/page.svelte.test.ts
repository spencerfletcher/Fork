import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	test('renders the site heading', () => {
		render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'feed', tags: [], sampleDiff: null }
			}
		});
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	test('landing mode renders exactly one h1, and it is the hero headline', () => {
		// The feed heading is demoted to h2 in landing mode so the page has
		// exactly one h1 — the hero's. That fix had no test at any level.
		render(Page, {
			props: {
				data: {
					recipes: [],
					user: null,
					profile: null,
					mode: 'landing',
					tags: [],
					sampleDiff: null
				}
			}
		});
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings).toHaveLength(1);
		expect(headings[0]).toHaveTextContent('Recipes, under version control.');
	});

	test('feed mode is browse: the tag tabs and a Recent section', () => {
		render(Page, {
			props: {
				data: {
					recipes: [{ id: 1, slug: 'a', title: 'A', updatedAt: new Date(), forkCount: 0 }],
					user: null,
					profile: null,
					mode: 'feed',
					tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }],
					sampleDiff: null
				} as never
			}
		});
		const tabs = screen.getByRole('navigation', { name: 'Browse by tag' });
		expect(within(tabs).getByRole('link', { name: 'All' })).toHaveAttribute('href', '/');
		expect(within(tabs).getByRole('link', { name: 'Dessert' })).toHaveAttribute(
			'href',
			'/tags/dessert'
		);
		expect(screen.getByRole('heading', { level: 2, name: 'Recent' })).toBeInTheDocument();
	});

	test('feed mode renders no LandingHero', () => {
		render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'feed', tags: [], sampleDiff: null }
			}
		});
		expect(screen.queryByText('Recipes, under version control.')).not.toBeInTheDocument();
	});

	test('the compare link points at the same version range as the diff shown', () => {
		// A recipe with 3+ versions exposes the bug this guards against: the link
		// used to point at v1→last regardless of which two versions the sample
		// diff beside it actually shows. It moved out of the hero — where it sat
		// a few hundred pixels above the diff it opened — to under the diff itself,
		// but it still has to open the exact pair being rendered.
		const sampleDiff = {
			recipeTitle: 'Chicken Tikka Masala',
			recipeSlug: 'chicken-tikka-masala-xyz',
			fromVersion: 2,
			toVersion: 3,
			commitMessage: 'Worked the smoked paprika into the marinade',
			metaDiff: [],
			ingredientDiff: [],
			stepDiff: [
				{
					status: 'added' as const,
					stepNumber: 7,
					step: { text: 'Garnish with fresh cilantro.' }
				}
			]
		};
		render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'landing', tags: [], sampleDiff }
			}
		});

		const link = screen.getByRole('link', { name: /open the full comparison/i });
		expect(link).toHaveAttribute(
			'href',
			`/recipes/${sampleDiff.recipeSlug}/diff?from=${sampleDiff.fromVersion}&to=${sampleDiff.toVersion}`
		);
		// The diff actually on the page came from the same fromVersion/toVersion
		// pair the link points at — same object, not two independently-guessed values.
		expect(screen.getByText('Garnish with fresh cilantro.')).toBeInTheDocument();
	});
});
