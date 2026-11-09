import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeCard from './RecipeCard.svelte';
import { formatTime } from '#lib/helpers.js';

const { mockGoto } = vi.hoisted(() => ({ mockGoto: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: mockGoto }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecipe(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		authorId: 'user-1',
		slug: 'chocolate-cake-abc123',
		title: 'Chocolate Cake',
		description: null,
		imageUrl: null,
		servings: null,
		prepTimeMinutes: null,
		cookTimeMinutes: null,
		parentId: null,
		visibility: 'public' as const,
		createdAt: new Date(),
		updatedAt: new Date(),
		editRevision: 0,
		...overrides
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RecipeCard', () => {
	test('renders the recipe title', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ title: 'Banana Bread' }) } });
		expect(screen.getByText('Banana Bread')).toBeInTheDocument();
	});

	test('card links to the recipe slug', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ slug: 'banana-bread-xyz' }) } });
		// Card uses a stretched <a> with aria-label matching the recipe title
		const link = screen.getByRole('link', { name: /chocolate cake/i });
		expect(link).toHaveAttribute('href', '/recipes/banana-bread-xyz');
	});

	test('shows combined total time when both prep and cook time are set', () => {
		render(RecipeCard, {
			props: { recipe: makeRecipe({ prepTimeMinutes: 20, cookTimeMinutes: 30 }) }
		});
		expect(screen.getByText('50 min')).toBeInTheDocument();
	});

	test('reads its times the way the recipe page does, in hours from an hour', () => {
		const [prep, cook] = [30, 60];
		const { unmount } = render(RecipeCard, {
			props: { recipe: makeRecipe({ prepTimeMinutes: prep, cookTimeMinutes: cook }) }
		});
		expect(screen.getByText(formatTime(prep + cook))).toBeInTheDocument();
		unmount();
		render(RecipeCard, { props: { recipe: makeRecipe({ cookTimeMinutes: cook + prep }) } });
		expect(screen.getByText(`${formatTime(cook + prep)} cook`)).toBeInTheDocument();
	});

	test('shows prep-only label when only prepTimeMinutes is set', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ prepTimeMinutes: 15 }) } });
		expect(screen.getByText('15 min prep')).toBeInTheDocument();
	});

	test('shows cook-only label when only cookTimeMinutes is set', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ cookTimeMinutes: 45 }) } });
		expect(screen.getByText('45 min cook')).toBeInTheDocument();
	});

	test('never shows tags or a forked badge', () => {
		const recipe = {
			...makeRecipe({ parentId: 42 }),
			recipesToTags: [{ tag: { id: 1, name: 'Dessert', slug: 'dessert' } }]
		};
		const { container } = render(RecipeCard, { props: { recipe } });
		expect(screen.queryByRole('link', { name: 'Dessert' })).toBeNull();
		expect(container.querySelector('.forked-badge')).toBeNull();
	});

	test('the description shows once, after the meta row', () => {
		const description = 'A rich and moist cake.';
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ description, prepTimeMinutes: 20 }) }
		});
		const line = screen.getByText(description);
		expect(screen.getAllByText(description)).toHaveLength(1);
		const meta = container.querySelector('.meta-row')!;
		expect(meta.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test.each([null, '', '   '])('a recipe with no description (%j) adds no line', (description) => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe({ description }) } });
		const card = container.querySelector('.recipe-card')!;
		expect([...card.querySelectorAll('p')]).toHaveLength(0);
	});

	test('a page that brings its own line under the card can leave the description out', () => {
		const description = 'A rich and moist cake.';
		render(RecipeCard, {
			props: { recipe: makeRecipe({ description }), showDescription: false }
		});
		expect(screen.queryByText(description)).toBeNull();
	});

	test('a recipe with a photo shows it with the title below', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ imageUrl: 'https://img/cake.jpg' }) }
		});
		expect(container.querySelector('img.card-img')).toHaveAttribute('src', 'https://img/cake.jpg');
		expect(container.querySelector('h3.card-title')).toHaveTextContent('Chocolate Cake');
		expect(container.querySelector('.card-panel')).toBeNull();
	});

	test('the photo has an empty alt: the heading and the link already name the recipe', () => {
		// The critique measured the title announced three times per card
		// (aria-label, alt, h3). The link keeps its label; the photo is decorative.
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ imageUrl: 'https://img/cake.jpg' }) }
		});
		expect(container.querySelector('img.card-img')).toHaveAttribute('alt', '');
		expect(screen.getByRole('link', { name: 'Chocolate Cake' })).toHaveClass('card-stretched-link');
	});

	test('the first row of photos loads eagerly, the very first first; the rest lazily', () => {
		const photo = (index?: number) => {
			const { container, unmount } = render(RecipeCard, {
				props: { recipe: makeRecipe({ imageUrl: 'https://img/cake.jpg' }), index }
			});
			const img = container.querySelector('img.card-img')!;
			const attrs = {
				loading: img.getAttribute('loading'),
				priority: img.getAttribute('fetchpriority')
			};
			unmount();
			return attrs;
		};
		expect(photo(0)).toEqual({ loading: 'eager', priority: 'high' });
		expect(photo(3)).toEqual({ loading: 'eager', priority: null });
		expect(photo(4)).toEqual({ loading: 'lazy', priority: null });
		expect(photo()).toEqual({ loading: 'lazy', priority: null });
	});

	test('the stretched link is a link and nothing more: no redundant tabindex', () => {
		render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(screen.getByRole('link', { name: 'Chocolate Cake' })).not.toHaveAttribute('tabindex');
	});

	test('a recipe without a photo shows its title inside the panel and nowhere else', () => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(screen.queryByRole('img')).toBeNull();
		// A heading either way, so screen-reader heading navigation does not
		// depend on whether a photo was uploaded.
		expect(container.querySelector('.card-panel h3.card-panel-title')).toHaveTextContent(
			'Chocolate Cake'
		);
		expect(container.querySelector('h3.card-title')).toBeNull();
		expect(screen.getAllByText('Chocolate Cake')).toHaveLength(1);
	});

	test('the author link is marked so the phone layout can hide it', () => {
		render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author: { id: 'u1', username: 'chefmaria' } } }
		});
		expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('meta-author');
	});

	test('the separators are drawn by CSS between items, never typed, so none can strand at a line end', () => {
		// At 768 the row wrapped as "… · v3 ·" then "1 fork". A dot drawn by
		// `.meta-item + .meta-item::before` is part of the item it precedes and
		// wraps with it (decided 29 October 2026).
		const { container } = render(RecipeCard, {
			props: {
				recipe: {
					...makeRecipe({ versionCount: 3, cookTimeMinutes: 28, forkCount: 1 }),
					author: { id: 'u1', username: 'chefmaria' }
				}
			}
		});
		const row = container.querySelector('.meta-row')!;
		expect(row.textContent).not.toContain('·');
		expect(container.querySelector('.meta-sep')).toBeNull();
		expect([...row.children].every((el) => el.classList.contains('meta-item'))).toBe(true);
	});

	test('on a phone the author hides, unless the page asks for it at every width', () => {
		const author = { id: 'u1', username: 'chefmaria' };
		const { container, unmount } = render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author } }
		});
		expect(container.querySelector('.recipe-card')).not.toHaveClass('author-always');
		unmount();

		const kept = render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author }, alwaysShowAuthor: true }
		});
		expect(kept.container.querySelector('.recipe-card')).toHaveClass('author-always');
	});

	test('shows @username link when author is present', () => {
		const recipe = {
			...makeRecipe(),
			author: { id: 'user-1', username: 'chefmaria' }
		};
		render(RecipeCard, { props: { recipe } });
		const link = screen.getByRole('link', { name: '@chefmaria' });
		expect(link).toHaveAttribute('href', '/users/chefmaria');
	});

	test('does not show author link when author is absent', () => {
		render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
	});

	test('shows the latest version number', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 3 }) } });
		expect(screen.getByText(/^v3$/)).toBeInTheDocument();
	});

	test('a one-version recipe shows no version mark, and its row keeps only its items', () => {
		// v1 on every unedited card was noise (Spencer: "sure only show mark
		// from v2"). The dots are CSS between items, so dropping one strands none.
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ versionCount: 1, cookTimeMinutes: 28, forkCount: 1 }) }
		});
		expect(screen.queryByText(/^v\d+$/)).toBeNull();
		expect(container.querySelector('.meta-item--accent')).toBeNull();
		const row = container.querySelector('.meta-row')!;
		expect([...row.children].map((el) => el.textContent)).toEqual(['28 min cook', '1 fork']);
	});

	test('the mark starts at v2', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 2 }) } });
		expect(screen.getByText(/^v2$/)).toHaveClass('meta-item--accent');
	});

	test('shows the fork count when the recipe has forks', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 2 }) } });
		expect(screen.getByText(/2 forks/)).toBeInTheDocument();
	});

	test('omits the fork count when there are none', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 0 }) } });
		// Matches the "N fork(s)" text specifically — the unrelated "Forked" badge
		// (hidden via CSS but still present in the DOM) also matches /fork/i.
		expect(screen.queryByText(/\d+ forks?/i)).not.toBeInTheDocument();
	});

	test('uses the singular for one fork', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 1, forkCount: 1 }) } });
		expect(screen.getByText(/1 fork(?!s)/)).toBeInTheDocument();
	});

	test('does not render a leading separator when author and times are absent', () => {
		// makeRecipe() has no author and null prep/cook times, so versionCount is
		// the first thing in the meta row — its separator must not render.
		// Inspects the whole row rather than a single span: matching just the
		// version-number text would pass even with a leading "·" still rendered.
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ versionCount: 3 }) }
		});
		const metaRow = container.querySelector('.meta-row');
		expect(metaRow?.textContent?.trim().startsWith('·')).toBe(false);
		// The dot is drawn only between two items, so a lone item has none.
		expect(metaRow?.children).toHaveLength(1);
	});
});

describe('RecipeCard audience mark', () => {
	test('a recipe only its owner sees says so in the meta row, with a lock', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: makeRecipe({ visibility: 'private' }) }
		});
		const mark = container.querySelector('.meta-audience')!;
		expect(mark).toHaveTextContent('Only me');
		expect(mark.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	test('a friends recipe says Friends', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ visibility: 'friends' }) } });
		expect(screen.getByText('Friends')).toBeInTheDocument();
	});

	test('a public recipe carries no mark', () => {
		const { container } = render(RecipeCard, { props: { recipe: makeRecipe() } });
		expect(container.querySelector('.meta-audience')).toBeNull();
	});
});

describe('RecipeCard in the Cookbook', () => {
	const author = { id: 'u2', username: 'devcooks' };

	test('an own recipe carries no owner line, no fork count and no description', () => {
		render(RecipeCard, {
			props: {
				recipe: {
					...makeRecipe({ description: 'Soft buns.', forkCount: 2, versionCount: 3 }),
					author
				},
				variant: 'cookbook'
			}
		});
		expect(screen.queryByText('@devcooks')).toBeNull();
		expect(screen.queryByText('2 forks')).toBeNull();
		expect(screen.queryByText('Soft buns.')).toBeNull();
		expect(screen.getByText('v3')).toBeInTheDocument();
	});

	test('a saved recipe says whose it is', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author }, variant: 'cookbook', saved: true }
		});
		expect(container.querySelector('.card-source')).toHaveTextContent('Saved from @devcooks');
		expect(screen.getByRole('link', { name: '@devcooks' })).toHaveAttribute(
			'href',
			'/users/devcooks'
		);
	});
});

describe('RecipeCard on Discover', () => {
	test('names its cook above the photo, with an initial avatar, and not again in the meta row', () => {
		const { container } = render(RecipeCard, {
			props: {
				recipe: { ...makeRecipe({ imageUrl: '/p.jpg' }), author: { id: 'u3', username: 'maria' } },
				variant: 'discover'
			}
		});
		const cook = container.querySelector('.card-cook')!;
		expect(cook).toHaveTextContent('@maria');
		expect(cook.querySelector('.card-avatar')).toHaveTextContent('M');
		expect(cook.compareDocumentPosition(container.querySelector('.card-img-wrap')!)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(screen.getAllByText('@maria')).toHaveLength(1);
	});
});
