import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RecipeCard from './RecipeCard.svelte';
import source from './RecipeCard.svelte?raw';
import { formatDuration } from '#lib/recipes/times.js';
import { dayLabel } from '#lib/journal.js';
import { cssRule } from '#lib/testing/css.js';
import { MARK_END, MARK_START } from '#lib/highlight.js';

const { mockGoto } = vi.hoisted(() => ({ mockGoto: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: mockGoto, afterNavigate: () => {} }));

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

	test('shows prep and cook as two spans, never an invented total', () => {
		render(RecipeCard, {
			props: { recipe: makeRecipe({ prepTimeMinutes: 20, cookTimeMinutes: 30 }) }
		});
		expect(screen.getByText('20 min prep')).toBeInTheDocument();
		expect(screen.getByText('30 min cook')).toBeInTheDocument();
		expect(screen.queryByText('50 min')).toBeNull();
	});

	test('reads its times the way the recipe page does, in hours from an hour', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ cookTimeMinutes: 90 }) } });
		expect(screen.getByText(`${formatDuration(90)} cook`)).toBeInTheDocument();
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

	test('titles wrap normally, never balanced', () => {
		expect(source).not.toMatch(/text-wrap: balance/);
	});

	test('the description clamps at two lines', () => {
		const rule = cssRule(source, '.card-description');
		expect(rule).toMatch(/-webkit-line-clamp: 2;/);
		expect(rule).toMatch(/\bline-clamp: 2;/);
	});

	test.each([
		['a photo', { imageUrl: '/p.jpg' }],
		['no photo', {}]
	])(
		'with %s, the words under the picture stack in one block, spaced by its gap alone',
		(_, overrides) => {
			const { container } = render(RecipeCard, {
				props: { recipe: makeRecipe({ ...overrides, description: 'Rich.', prepTimeMinutes: 20 }) }
			});
			const text = container.querySelector('.card-text')!;
			expect(text.querySelector('.meta-row')).not.toBeNull();
			expect(text.querySelector('.card-description')).not.toBeNull();
			if ('imageUrl' in overrides) expect(text.querySelector('.card-title')).not.toBeNull();
			for (const cls of ['card-title', 'meta-row', 'card-description', 'card-source']) {
				const rule = cssRule(source, `.${cls}`);
				expect(rule, cls).not.toMatch(/margin/);
			}
		}
	);

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

	test('the author is Username, in an item marked so the phone layout can hide it', () => {
		render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author: { id: 'u1', username: 'chefmaria' } } }
		});
		const link = screen.getByRole('link', { name: '@chefmaria' });
		expect(link).toHaveClass('username');
		expect(link.closest('.meta-author')).not.toBeNull();
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
		expect(container.querySelector('.vid')).toBeNull();
		const row = container.querySelector('.meta-row')!;
		expect([...row.children].map((el) => el.textContent)).toEqual(['28 min cook', '1 fork']);
	});

	test('the mark starts at v2', () => {
		render(RecipeCard, { props: { recipe: makeRecipe({ versionCount: 2 }) } });
		expect(screen.getByText(/^v2$/)).toHaveClass('vid');
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

	test('two across on a phone, so its title keeps the small size; Discover’s one column steps up', () => {
		const { container, unmount } = render(RecipeCard, {
			props: { recipe: makeRecipe(), variant: 'cookbook' }
		});
		expect(container.querySelector('.recipe-card')).not.toHaveClass('recipe-card--roomy');
		unmount();
		const discover = render(RecipeCard, { props: { recipe: makeRecipe(), variant: 'discover' } });
		expect(discover.container.querySelector('.recipe-card')).toHaveClass('recipe-card--roomy');
	});

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
		const link = screen.getByRole('link', { name: '@devcooks' });
		expect(link).toHaveAttribute('href', '/users/devcooks');
		expect(link).toHaveClass('username');
	});

	test('a kept copy of a recipe its author withdrew says so, in place of whose it is', () => {
		const { container } = render(RecipeCard, {
			props: { recipe: { ...makeRecipe(), author }, variant: 'cookbook', saved: true, kept: true }
		});
		expect(container.querySelector('.card-source')).toHaveTextContent(
			'No longer shared by @devcooks'
		);
	});

	test('a kept copy whose author deleted their account names no one and links nowhere', () => {
		const { container } = render(RecipeCard, {
			props: {
				recipe: { ...makeRecipe(), author: null },
				variant: 'cookbook',
				saved: true,
				kept: true
			}
		});
		const line = container.querySelector('.card-source')!;
		expect(line.textContent!.replace(/\s+/g, ' ').trim()).toBe('No longer shared by its author');
		expect(line.querySelector('a')).toBeNull();
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
		expect(cook.querySelector('.avatar')).toHaveTextContent('M');
		expect(cook.compareDocumentPosition(container.querySelector('.card-img-wrap')!)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect(screen.getAllByText('@maria')).toHaveLength(1);
	});

	test('the avatar and handle are one profile link, ahead of the recipe link in tab order, with no link inside another', () => {
		const { container } = render(RecipeCard, {
			props: {
				recipe: { ...makeRecipe(), author: { id: 'u3', username: 'maria' } },
				variant: 'discover'
			}
		});
		const profile = screen.getByRole('link', { name: '@maria' });
		expect(profile).toHaveAttribute('href', '/users/maria');
		expect(profile.querySelector('.avatar')).not.toBeNull();
		const links = [...container.querySelectorAll('a')];
		expect(links.map((a) => a.getAttribute('href'))).toEqual([
			'/users/maria',
			'/recipes/chocolate-cake-abc123'
		]);
		expect(container.querySelector('a a')).toBeNull();
	});
});

describe('RecipeCard: times and last cooked', () => {
	const cookbookCard = (overrides: Record<string, unknown>) =>
		render(RecipeCard, {
			props: { recipe: makeRecipe({ cookTimeMinutes: 40, ...overrides }), variant: 'cookbook' }
		});
	const lastItem = (container: HTMLElement) =>
		container.querySelector('.meta-row .meta-item:last-child')!;

	test('cooked once: the day, last in the meta row in the meta style', () => {
		const { container } = cookbookCard({ timesCooked: 1, lastCookedOn: '2026-11-08' });
		expect(lastItem(container).textContent!.trim()).toBe(`Cooked on ${dayLabel('2026-11-08')}`);
		expect(lastItem(container)).not.toHaveClass('vid');
	});

	test('cooked more than once: the count and the last day', () => {
		const { container } = cookbookCard({ timesCooked: 4, lastCookedOn: '2026-11-03' });
		expect(lastItem(container).textContent!.trim()).toBe(
			`Cooked 4 times, last on ${dayLabel('2026-11-03')}`
		);
	});

	test('never cooked, or no counts from the page: nothing', () => {
		const { container } = cookbookCard({});
		expect(container.querySelector('.meta-row')!.textContent).not.toContain('Cooked');
	});

	describe('a search match', () => {
		const m = (s: string) => s.replaceAll('[', MARK_START).replaceAll(']', MARK_END);

		test('marks the matched words in the title, the link still named by the plain title', () => {
			const { container } = render(RecipeCard, {
				props: {
					recipe: makeRecipe({ title: 'Ginger snaps', match: { title: m('[Ginger] snaps') } })
				}
			});
			expect([...container.querySelectorAll('mark')].map((e) => e.textContent)).toEqual(['Ginger']);
			expect(container.querySelector('h3')?.textContent?.trim()).toBe('Ginger snaps');
			expect(screen.getByRole('link', { name: 'Ginger snaps' })).toBeInTheDocument();
		});

		test('says where it matched in place of the description', () => {
			const { container } = render(RecipeCard, {
				props: {
					recipe: makeRecipe({
						title: 'Stir fry',
						description: 'Quick.',
						match: { title: 'Stir fry', label: 'Ingredient', text: m('fresh [ginger]') }
					})
				}
			});
			expect(container.querySelector('.card-match')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
				'Ingredient: fresh ginger'
			);
			expect(container.querySelector('.card-match mark')?.textContent).toBe('ginger');
			expect(screen.queryByText('Quick.')).not.toBeInTheDocument();
		});

		test("markup in a recipe's words is text, never HTML", () => {
			const { container } = render(RecipeCard, {
				props: {
					recipe: makeRecipe({
						title: '<img src=x onerror=alert(1)> cake',
						match: {
							title: m('<img src=x onerror=alert(1)> [cake]'),
							label: 'Ingredient',
							text: m('<b>[cake]</b> flour')
						}
					})
				}
			});
			expect(container.querySelector('img')).toBeNull();
			expect(container.querySelector('b')).toBeNull();
			expect(container.querySelector('h3')?.textContent).toContain('<img src=x onerror=alert(1)>');
			expect(container.querySelector('.card-match')?.textContent).toContain('<b>cake</b> flour');
		});
	});
});

describe('RecipeCard in the Cookbook: the ⋯', () => {
	// The collections are asked for as the menu opens; left unanswered here,
	// the rest of the menu is what each kind of card offers.
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise(() => {}))
		);
	});

	const card = (overrides: Record<string, unknown> = {}, recipe = {}) =>
		render(RecipeCard, {
			props: { recipe: makeRecipe(recipe), variant: 'cookbook', ...overrides } as never
		});

	async function rowsAfterOpening() {
		await fireEvent.click(screen.getByRole('button', { name: 'More actions for Chocolate Cake' }));
		const menu = screen.getByRole('menu', { name: 'More actions' });
		// The Loading collections… row aside, which the collections replace.
		return [...menu.querySelectorAll('[role^="menuitem"]:not([aria-busy])')].map((r) =>
			r.textContent?.trim()
		);
	}

	test('ends the title’s line, after the stretched link in Tab order, never inside it', () => {
		const { container } = card({}, { imageUrl: 'https://img/cake.jpg' });
		const more = screen.getByRole('button', { name: 'More actions for Chocolate Cake' });
		expect(more).toHaveClass('more-button');
		expect(more.closest('a')).toBeNull();
		expect(more.closest('.card-line')!.querySelector('.card-title')).not.toBeNull();
		const link = container.querySelector('.card-stretched-link')!;
		expect(link.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test('without a photo it ends the meta row’s line, the title being the panel', () => {
		card({}, { prepTimeMinutes: 10 });
		const more = screen.getByRole('button', { name: 'More actions for Chocolate Cake' });
		expect(more.closest('.card-line')!.querySelector('.meta-row')).not.toBeNull();
	});

	test('sits above the stretched link, so pointing at it is not pointing at the recipe', () => {
		const rule = cssRule(source, '.card-more');
		expect(rule).toMatch(/position:\s*relative/);
		expect(rule).toMatch(/z-index:\s*2/);
	});

	test('the 44px square overhangs its line above and below only, never past the card', () => {
		expect(cssRule(source, '.card-more')).toMatch(/margin:\s*-11px 0;/);
	});

	test('the cook’s own recipe: Edit, the Exports and Move to Trash, no Fork', async () => {
		card();
		const rows = await rowsAfterOpening();
		expect(rows).toEqual(
			expect.arrayContaining(['Add to Journal', 'Edit recipe', 'Move to Trash'])
		);
		expect(rows).not.toContain('Fork');
	});

	test('a saved recipe: Fork, and nothing of the owner’s', async () => {
		card({ saved: true });
		const rows = await rowsAfterOpening();
		expect(rows).toContain('Fork');
		expect(rows).not.toContain('Edit recipe');
		expect(rows).not.toContain('Move to Trash');
		expect(rows.some((r) => r?.startsWith('Export'))).toBe(false);
	});

	test('a kept copy: Add to Journal and Remove from Cookbook, no Fork', async () => {
		card({ saved: true, kept: true });
		expect(await rowsAfterOpening()).toEqual(['Add to Journal', 'Remove from Cookbook']);
	});

	test('other lists have no ⋯', () => {
		render(RecipeCard, { props: { recipe: makeRecipe() } });
		render(RecipeCard, { props: { recipe: makeRecipe(), variant: 'discover' } });
		expect(screen.queryByRole('button', { name: /More actions/ })).toBeNull();
	});
});
