import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import source from './+page.svelte?raw';

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

	test("landing mode ends on the browse page's section pattern: a Recent eyebrow, the cards, an All recipes link", () => {
		// The pre-redesign header ("Recipes" h2, "Recipes worth forking.", a rule)
		// sat under the sample diff; the landing now uses the section pattern
		// /recipes renders and closes with a way to the rest (29 October 2026).
		const { container } = render(Page, {
			props: {
				data: {
					recipes: [{ id: 1, slug: 'a', title: 'A', updatedAt: new Date(), forkCount: 0 }],
					user: null,
					profile: null,
					mode: 'landing',
					tags: [],
					sampleDiff: null
				} as never
			}
		});
		const recent = screen.getByRole('heading', { level: 2, name: 'Recent' });
		expect(recent).toHaveClass('eyebrow-label', 'section-heading');
		expect(screen.queryByRole('heading', { name: 'Recipes' })).toBeNull();
		expect(screen.queryByText('Recipes worth forking.')).toBeNull();
		expect(container.querySelector('hr')).toBeNull();
		// The arrow form every other closing link uses, on the shared hit-area
		// class (decided 29 October 2026).
		const all = screen.getByRole('link', { name: 'All recipes →' });
		expect(all).toHaveAttribute('href', '/recipes');
		expect(all).toHaveClass('arrow-link');
		const grid = container.querySelector('.recipe-grid')!;
		expect(grid.compareDocumentPosition(all) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		// One column, the site's: the hero, the diff and the grid all sit inside
		// the page's own gutters rather than each bringing their own.
		expect(container.querySelectorAll('.page-inner')).toHaveLength(1);
		expect(container.querySelector('.page-inner')).toContainElement(
			screen.getByRole('heading', { level: 1 })
		);
		expect(container.querySelector('.page-inner')).toContainElement(grid as HTMLElement);
	});

	test('a signed-out landing closes on a ghost "Sign up to fork one"; signed in adds nothing', () => {
		// The quiet closing line after the last section (decided 29 October 2026):
		// centred on a phone, on the column's left edge otherwise.
		const recipes = [{ id: 1, slug: 'a', title: 'A', updatedAt: new Date(), forkCount: 0 }];
		const { container, unmount } = render(Page, {
			props: {
				data: { recipes, user: null, profile: null, mode: 'landing', tags: [], sampleDiff: null }
			} as never
		});
		const signup = screen.getByRole('link', { name: 'Sign up to fork one' });
		expect(signup).toHaveAttribute('href', '/signup');
		expect(signup).toHaveClass('btn-ghost');
		const sections = container.querySelectorAll('section');
		const last = sections[sections.length - 1];
		expect(last.compareDocumentPosition(signup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(last).not.toContainElement(signup);
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		expect(phone).toMatch(/\.signup-close\s*{[^}]*text-align:\s*center/);
		unmount();

		render(Page, {
			props: {
				data: {
					recipes,
					user: { id: 'u1', username: 'cook' },
					profile: null,
					mode: 'feed',
					tags: [],
					sampleDiff: null
				}
			} as never
		});
		expect(screen.queryByRole('link', { name: 'Sign up to fork one' })).toBeNull();
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
		// The shared closing-link form, like "All recipes →": sans, 24/44px hits.
		expect(link).toHaveClass('arrow-link');
		expect(link).toHaveAttribute(
			'href',
			`/recipes/${sampleDiff.recipeSlug}/diff?from=${sampleDiff.fromVersion}&to=${sampleDiff.toVersion}`
		);
		// The diff actually on the page came from the same fromVersion/toVersion
		// pair the link points at — same object, not two independently-guessed values.
		expect(screen.getByText('Garnish with fresh cilantro.')).toBeInTheDocument();
	});

	test('the landing grid sits below the fold, so its photos all load lazily', () => {
		// Passing index made three below-fold photos eager and the first
		// fetchpriority=high at 1359px of a 2212px phone page.
		const recipes = [1, 2, 3, 4].map((id) => ({
			id,
			slug: `r${id}`,
			title: `R${id}`,
			imageUrl: `https://img/${id}.jpg`,
			updatedAt: new Date(),
			forkCount: 0
		}));
		const { container } = render(Page, {
			props: {
				data: { recipes, user: null, profile: null, mode: 'landing', tags: [], sampleDiff: null }
			} as never
		});
		const imgs = [...container.querySelectorAll('img.card-img')];
		expect(imgs).toHaveLength(4);
		expect(imgs.every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
		expect(imgs.some((img) => img.hasAttribute('fetchpriority'))).toBe(false);
	});

	test('the landing grid is capped at two rows: on a phone the six cards scroll sideways', () => {
		// Six cards (Spencer: "2 rows should be max and then we should have
		// scrolling functionality"): 4 + 2 at four columns, 3 + 3 at three; two
		// columns would need three rows, so the phone flows two rows by column.
		const recipes = [1, 2].map((id) => ({ id, slug: `r${id}`, title: `R${id}`, forkCount: 0 }));
		const { container } = render(Page, {
			props: {
				data: { recipes, user: null, profile: null, mode: 'landing', tags: [], sampleDiff: null }
			} as never
		});
		expect(container.querySelector('.recipe-grid')).toHaveClass('recent-strip');
		// jsdom applies no component CSS, so the rule is read from the source.
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		const rule = phone.match(/\.recent-strip\s*{([^}]*)}/)![1];
		expect(rule).toMatch(/grid-auto-flow:\s*column/);
		expect(rule).toMatch(/grid-template-rows:\s*repeat\(2,/);
		expect(rule).toMatch(/overflow-x:\s*auto/);
		expect(rule).toMatch(/scroll-snap-type:\s*x/);
	});

	test('keyboard focus on a strip card scrolls that card into view, smoothly unless motion is reduced', async () => {
		// Chromium does not scroll a horizontal scroller to a focused link inside
		// a grid cell, so a tab past the third card landed off screen.
		const recipes = [1, 2, 3].map((id) => ({ id, slug: `r${id}`, title: `R${id}`, forkCount: 0 }));
		const { container } = render(Page, {
			props: {
				data: { recipes, user: null, profile: null, mode: 'landing', tags: [], sampleDiff: null }
			} as never
		});
		const strip = container.querySelector('.recent-strip')!;
		const card = strip.children[2] as HTMLElement;
		const scrolled: { el: Element; arg: unknown }[] = [];
		const original = Element.prototype.scrollIntoView;
		Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
			scrolled.push({ el: this, arg });
		};
		try {
			const link = card.querySelector('a')!;
			await fireEvent.focusIn(link);
			expect(scrolled).toEqual([{ el: card, arg: { block: 'nearest', inline: 'nearest' } }]);
		} finally {
			Element.prototype.scrollIntoView = original;
		}
		// No behavior is passed, so the strip's CSS scroll-behavior decides: smooth
		// only under no-preference, so reduced motion gets an instant jump.
		const motion = source.slice(source.indexOf('(prefers-reduced-motion: no-preference)'));
		expect(motion).toMatch(/\.recent-strip\s*{[^}]*scroll-behavior:\s*smooth/);
	});

	test('the landing sample folds its unchanged rows on a phone', () => {
		const sampleDiff = {
			recipeTitle: 'T',
			recipeSlug: 't',
			fromVersion: 1,
			toVersion: 2,
			commitMessage: null,
			metaDiff: [],
			ingredientDiff: [],
			stepDiff: [
				{ status: 'unchanged' as const, stepNumber: 1, step: { text: 'Mix.' } },
				{ status: 'unchanged' as const, stepNumber: 2, step: { text: 'Rest.' } },
				{ status: 'added' as const, stepNumber: 3, step: { text: 'Bake.' } }
			]
		};
		const { container } = render(Page, {
			props: {
				data: { recipes: [], user: null, profile: null, mode: 'landing', tags: [], sampleDiff }
			} as never
		});
		expect(container.querySelector('.diff-fold')).toHaveTextContent('2 unchanged');
	});
});
