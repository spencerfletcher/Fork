import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import RecipeHeader from './RecipeHeader.svelte';
import source from './RecipeHeader.svelte?raw';
import type { ComponentProps } from 'svelte';
import { makeContent, makeVersion } from '#lib/recipes/fixtures.js';
import { scaling } from '#lib/recipes/scale.js';
import { cssRule } from '#lib/testing/css.js';

vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HeaderProps = ComponentProps<typeof RecipeHeader>;

function makeRecipe(overrides: Partial<HeaderProps['recipe']> = {}): HeaderProps['recipe'] {
	return { slug: 'my-fork', parentId: null, parent: null, ...overrides };
}

const CONTENT = makeContent({
	title: 'Old Title',
	servings: 4,
	description: 'Crisp edges.',
	imageUrl: null
});

const V1 = { ...makeVersion(1, 'Initial recipe'), ...CONTENT };
const V3 = { ...makeVersion(3, 'Chill the dough'), ...CONTENT };

function renderHeader(overrides: Partial<HeaderProps> = {}) {
	return render(RecipeHeader, {
		props: {
			recipe: makeRecipe(),
			currentVersion: V1,
			forkCount: 0,
			tags: [],
			...overrides
		}
	});
}

/** The byline as a reader sees it: sr-only prefixes dropped, whitespace collapsed. */
// The byline's dots are drawn by app.css's .dot-list between its parts, not
// typed; jsdom draws no CSS, so the helper puts them where the rule does.
function byline(container: HTMLElement) {
	const copy = container.querySelector('.byline')!.cloneNode(true) as HTMLElement;
	expect(copy).toHaveClass('dot-list');
	copy.querySelectorAll('.sr-only').forEach((el) => el.remove());
	return [...copy.children]
		.map((part) => part.textContent!.replace(/\s+/g, ' ').trim())
		.join(' · ');
}

// ─── Fork attribution ─────────────────────────────────────────────────────────

describe('RecipeHeader fork attribution', () => {
	// The fork info folds into the byline; there is no attribution line. The
	// parent's author is named by handle (decided 12 November 2026).
	test("a fork names the parent's author, the handle its own link in the author's face", () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parentVersion: 2,
				parent: { slug: 'original', title: 'The Original', author: { username: 'gran' } }
			})
		});
		expect(byline(container)).toBe("By @me · forked from @gran's The Original, v2");
		const own = screen.getByRole('link', { name: '@me' });
		const theirs = screen.getByRole('link', { name: '@gran' });
		expect(theirs).toHaveAttribute('href', '/users/gran');
		// Styled exactly as the fork's own handle in the same line.
		expect(theirs.className).toBe(own.className);
		// The title and version stay the one link to the copied version.
		expect(screen.getByRole('link', { name: 'The Original, v2' })).toHaveAttribute(
			'href',
			'/recipes/original?version=2'
		);
		// The handle and its 's wrap as one unit, broken only when wider than the line.
		expect(theirs.parentElement).toHaveClass('inline-block', 'max-w-full');
		expect(theirs.parentElement).toHaveTextContent("@gran's");
	});

	test('a fork of your own recipe names you twice', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: { slug: 'original', title: 'The Original', author: { username: 'me' } }
			})
		});
		expect(byline(container)).toBe("By @me · forked from @me's The Original");
		expect(screen.getAllByRole('link', { name: '@me' })).toHaveLength(2);
	});

	test("a parent whose author's account is gone keeps its title, with no handle", () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: { slug: 'original', title: 'The Original', author: null }
			})
		});
		expect(byline(container)).toBe('By @me · forked from The Original');
		expect(screen.getAllByRole('link').map((a) => a.textContent!.trim())).toEqual([
			'@me',
			'The Original'
		]);
	});

	test('a fork says so in the byline, linking the parent', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: { slug: 'original', title: 'The Original' }
			})
		});
		expect(byline(container)).toBe('By @me · forked from The Original');
		const parent = screen.getByRole('link', { name: 'The Original' });
		expect(parent).toHaveAttribute('href', '/recipes/original');
		expect(container.querySelector('.byline')).toContainElement(parent);
		expect(container.querySelector('.attribution')).toBeNull();
	});

	test('a fork that recorded the version it copied names it and links that version', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parentVersion: 2,
				parent: { slug: 'original', title: 'The Original' }
			})
		});
		expect(byline(container)).toBe('By @me · forked from The Original, v2');
		const parent = screen.getByRole('link', { name: 'The Original, v2' });
		expect(parent).toHaveAttribute('href', '/recipes/original?version=2');
		expect(parent.querySelector('.mono-id')).toHaveTextContent('v2');
	});

	test('its own forks are not in the byline: they moved to the stats row', () => {
		const { container } = renderHeader({
			forkCount: 2,
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: { slug: 'original', title: 'The Original' }
			})
		});
		expect(byline(container)).toBe('By @me · forked from The Original');
		expect(container.querySelector('.byline a[href$="/forks"]')).toBeNull();
	});

	test('says the parent is private when the server withheld it', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'me' }, parentId: 42, parent: null })
		});
		expect(byline(container)).toBe('By @me · forked from a private recipe');
		expect(screen.getAllByRole('link')).toHaveLength(1);
	});

	test('says the original was deleted, with no link, when the parent row is gone', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: null,
				parentDeleted: true
			})
		});
		expect(byline(container)).toBe('By @me · Original recipe deleted');
		expect(screen.getAllByRole('link')).toHaveLength(1);
	});

	test('shows no attribution for a recipe that is not a fork', () => {
		renderHeader();
		expect(screen.queryByText(/forked from/i)).not.toBeInTheDocument();
	});

	test('an author whose account is gone gets no byline: no name, no link', () => {
		const { container } = renderHeader({ recipe: makeRecipe({ author: null }) });
		expect(byline(container)).toBe('');
		expect(screen.queryByText(/^By/)).not.toBeInTheDocument();
		expect(screen.queryAllByRole('link')).toHaveLength(0);
	});
});

// ─── The chip ─────────────────────────────────────────────────────────────────

describe('RecipeHeader chip', () => {
	test("shows the viewed version's title", () => {
		renderHeader();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Old Title');
	});

	test('the description sits under the byline, before the measure', () => {
		const { container } = renderHeader({ currentVersion: V3 });
		const byline = container.querySelector('.byline')!;
		const description = container.querySelector('.description')!;
		const details = container.querySelector('.details')!;
		expect(description).toHaveTextContent('Crisp edges.');
		expect(
			byline.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		expect(
			description.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('the closed header carries no version number and no note: both live in the bar', () => {
		const { container } = renderHeader({ currentVersion: V3 });
		expect(container.querySelector('.version')).toBeNull();
		expect(screen.queryByText('Chill the dough')).toBeNull();
		expect(screen.queryByRole('button', { name: /versions/ })).toBeNull();
	});
});

// ─── The byline ───────────────────────────────────────────────────────────────

describe('RecipeHeader byline', () => {
	test('the author in one sans line; forks go to the stats row, the version to the bar', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } }),
			currentVersion: V3,
			forkCount: 1
		});
		expect(byline(container)).toBe('By @chef');
		expect(container.querySelector('.byline a[href*="/diff"]')).toBeNull();
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
	});

	test('the handle keeps the Username face: the byline overrides neither its family nor its size', () => {
		// "By" is sans, "@author" is mono clay at the byline's size, "· forked from"
		// is sans. The byline's sans exception was withdrawn on 29 October 2026;
		// jsdom applies no component CSS, so the override is read from the source.
		expect(source).not.toMatch(/:global\(\.username\)/);
	});

	test('no forks: the byline is just the author', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } })
		});
		expect(byline(container)).toBe('By @chef');
	});
});

// ─── The stats row ────────────────────────────────────────────────────────────

describe('RecipeHeader stats row', () => {
	// Spencer, 31 October 2026: "I like the stats row 1b": an icon and its
	// words; the words carry the meaning, the icon is decoration. The save
	// count moved onto the Save pill (9 Nov 2026); the version count left for
	// the version bar's own toggle (12 Nov 2026: "cut from stats row").
	const stats = (container: HTMLElement) =>
		[...container.querySelectorAll('.stats > *')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);

	test('reads the fork count alone, under the tags: description, measure, tags, stats', () => {
		const { container } = renderHeader({
			currentVersion: V3,
			forkCount: 2,
			tags: [{ id: 1, name: 'Baking', slug: 'baking' }]
		});
		expect(stats(container)).toEqual(['2 forks']);
		const order = ['.byline', '.description', '.details', '.tags', '.stats'].map((selector) =>
			container.querySelector(selector)!
		);
		for (let i = 1; i < order.length; i++) {
			expect(
				order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		}
	});

	test('says nothing of versions: the version bar counts them', () => {
		const { container } = renderHeader({ currentVersion: V3 });
		expect(container.querySelector('.stats')!.textContent).not.toMatch(/version/i);
		expect(container.querySelector('a[href="#versions"]')).toBeNull();
	});

	test('one is singular', () => {
		const { container } = renderHeader({ forkCount: 1 });
		expect(stats(container)).toEqual(['1 fork']);
	});

	test('none says so in words, and an empty count is not a link', () => {
		const { container } = renderHeader({ forkCount: 0 });
		expect(stats(container)).toEqual(['No forks']);
		expect(container.querySelector('.stats a')).toBeNull();
	});

	test('the fork count links to the list of forks', () => {
		renderHeader({ forkCount: 2, recipe: makeRecipe({ slug: 'classic-cookies' }) });
		expect(screen.getByRole('link', { name: '2 forks' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies/forks'
		);
	});

	test('says nothing of saves or favorites: the count is on the Save pill', () => {
		const { container } = renderHeader({ forkCount: 2 });
		expect(container.querySelector('.stats')!.textContent).not.toMatch(/save|favorite/i);
	});

	test('the count carries a 16px icon hidden from assistive tech', () => {
		const { container } = renderHeader({ forkCount: 2 });
		const icons = container.querySelectorAll('.stats svg');
		expect(icons).toHaveLength(1);
		for (const icon of icons) {
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).toHaveClass('size-4');
		}
	});

	// Line art in one 1.5 stroke on a 16px box (decided 9 November 2026).
	test('the fork icon is line art: one 1.5 stroke, no dots or fills', () => {
		const { container } = renderHeader({ forkCount: 2 });
		const fork = container.querySelector('.stats svg')!;
		expect(fork).toHaveAttribute('viewBox', '0 0 16 16');
		expect(fork).toHaveAttribute('stroke-width', '1.5');
		expect(fork).toHaveAttribute('fill', 'none');
		expect(fork.querySelectorAll('circle, [fill]:not(svg)')).toHaveLength(0);
		const d = [...fork.querySelectorAll('path')].map((p) => p.getAttribute('d')).join(' ');
		// The fork (1A): the outer tines and their round shoulder as one stroke,
		// the middle tine running on as the handle as the other.
		expect(d.match(/M/g)).toHaveLength(2);
		expect(d.match(/a/g)).toHaveLength(1);
	});

	test('the row takes the byline size, so the header keeps one metadata size', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const rule = (name: string) => cssRule(source, `.${name}`);
		const size = (css: string) => css.match(/font-size: ([^;]+);/)?.[1];
		expect(size(rule('stats'))).toBeDefined();
		expect(size(rule('stats'))).toBe(size(rule('byline')));
		expect(rule('stats')).toMatch(/column-gap: 20px;/);
		expect(rule('stats')).toMatch(/flex-wrap: wrap;/);
	});
});

// ─── Header content ───────────────────────────────────────────────────────────

describe('RecipeHeader content', () => {
	test('the title and byline break a long unbroken word, so a phone never scrolls sideways', () => {
		// The title breaks by the base h1 rule, pinned in app.css.test.ts.
		const { container } = renderHeader();
		expect(container.querySelector('.byline')).toHaveClass('[overflow-wrap:anywhere]');
	});

	test('says the serves from the content it is given in the measure line, as plain text', () => {
		const { container } = renderHeader();
		expect(container.querySelector('.details')!.textContent!.replace(/\s+/g, ' ')).toContain(
			'Serves 4'
		);
		expect(container.querySelector('header input, header button')).toBeNull();
	});

	test('hands the scaling to the measure, so scaled serves read clay', () => {
		renderHeader({
			currentVersion: { ...V1, servings: 3 },
			scale: scaling({ ...V1, servings: 3 }, 12)
		});
		expect(screen.getByText('12')).toHaveClass('text-accent');
	});

	test('a blank servings on the viewed version shows no serves', () => {
		renderHeader({ currentVersion: { ...V1, servings: null } });
		expect(screen.queryByText(/Serves/)).toBeNull();
	});

	test('lists tags as comma-separated links, not pills', () => {
		renderHeader({
			tags: [
				{ id: 1, name: 'Dessert', slug: 'dessert' },
				{ id: 2, name: 'Baking', slug: 'baking' }
			]
		});
		const dessert = screen.getByRole('link', { name: 'Dessert' });
		expect(dessert).toHaveAttribute('href', '/tags/dessert');
		expect(dessert).not.toHaveClass('tag');
		expect(dessert.parentElement).toHaveTextContent('Dessert, Baking');
		// Taxonomy, not history: the body face below the measure; each tag a link
		// like every other link on the site, bold, its clay the global link rule's
		// (app.css), the commas quiet.
		expect(dessert.parentElement).toHaveClass('font-sans', 'text-text-2');
		expect(dessert).toHaveClass('font-semibold');
		const details = dessert.closest('header')!.querySelector('.details')!;
		expect(
			dessert.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_PRECEDING
		).toBeTruthy();
	});

	test('the description clamps at three lines with an ellipsis at every width', () => {
		// jsdom applies no component CSS, so the clamp is read from the source:
		// on the .description rule itself, not inside a media query.
		const rule = cssRule(source, '.description');
		expect(rule).toMatch(/line-clamp: 3;/);
		expect(rule).toMatch(/-webkit-line-clamp: 3;/);
		expect(rule).toMatch(/overflow: hidden;/);
	});

	test('carries no photo: that is the page’s to place', () => {
		renderHeader({ currentVersion: { ...V1, imageUrl: 'https://img/cookies.jpg' } });
		expect(screen.queryByRole('img')).toBeNull();
	});

	test('the action row is the last line of the header, after the meta', () => {
		const { container } = renderHeader({
			currentVersion: V3,
			actions: createRawSnippet(() => ({ render: () => '<button>Fork this recipe</button>' }))
		});
		const button = screen.getByRole('button', { name: 'Fork this recipe' });
		const meta = container.querySelector('.details')!;
		expect(meta.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(container.querySelector('header')!.lastElementChild).toContainElement(button);
	});

	test('renders no meta line and no tags when there is nothing to show', () => {
		const { container } = renderHeader({
			currentVersion: { ...V1, servings: null, prepTimeMinutes: null, cookTimeMinutes: null }
		});
		expect(container.querySelector('.details')).toBeNull();
		expect(container.querySelector('.tags')).toBeNull();
	});
});

// ─── The personal line ────────────────────────────────────────────────────────

describe('RecipeHeader personal line', () => {
	const ADD = '/journal/new?recipe=my-fork&version=1';

	test('a reader who logged it: the date links to that entry, and nothing else', () => {
		const { container } = renderHeader({
			journal: { lastEntry: { id: 12, cookedOn: '2026-11-08', timesCooked: 1 }, addHref: ADD }
		});
		const line = container.querySelector('.personal')!;
		expect(line.textContent!.replace(/\s+/g, ' ').trim()).toBe('You cooked this on Sun 8 Nov');
		expect(screen.getByRole('link', { name: 'Sun 8 Nov' })).toHaveAttribute(
			'href',
			'/journal#entry-12'
		);
		// Add to Journal is a pill in the action row, never a line below it.
		expect(screen.queryByRole('link', { name: 'Add to Journal' })).toBeNull();
	});

	test('cooked more than once: the count, then the last day linking to that entry', () => {
		const { container } = renderHeader({
			journal: { lastEntry: { id: 12, cookedOn: '2026-11-03', timesCooked: 4 }, addHref: ADD }
		});
		const line = container.querySelector('.personal')!;
		expect(line.textContent!.replace(/\s+/g, ' ').trim()).toBe(
			'You cooked this 4 times, last on Tue 3 Nov'
		);
		expect(screen.getByRole('link', { name: 'Tue 3 Nov' })).toHaveAttribute(
			'href',
			'/journal#entry-12'
		);
	});

	test('never logged or signed out: no line', () => {
		const first = renderHeader({ journal: { lastEntry: null, addHref: ADD } });
		expect(first.container.querySelector('.personal')).toBeNull();
		first.unmount();

		const signedOut = renderHeader({ journal: null });
		expect(signedOut.container.querySelector('.personal')).toBeNull();
	});
});

// ─── Source ───────────────────────────────────────────────────────────────────

describe('RecipeHeader source', () => {
	const withSource = (sourceName: string | null, sourceUrl: string | null) =>
		renderHeader({ currentVersion: { ...V1, sourceName, sourceUrl } });

	test('a name with a link reads as the name, linking out without passing anything on', () => {
		const { container } = withSource('Jerusalem', 'https://example.com/book');
		const link = screen.getByRole('link', { name: 'Jerusalem' });
		expect(link).toHaveAttribute('href', 'https://example.com/book');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
		expect(container.querySelector('.source')!.textContent!.replace(/\s+/g, ' ').trim()).toBe(
			'Source: Jerusalem'
		);
	});

	test('a link with no name shows its host', () => {
		withSource(null, 'https://www.bbc.co.uk/food/recipes/x');
		expect(screen.getByRole('link', { name: 'bbc.co.uk' })).toHaveAttribute(
			'href',
			'https://www.bbc.co.uk/food/recipes/x'
		);
	});

	test('a name with no link is plain text', () => {
		const { container } = withSource('Gran', null);
		expect(container.querySelector('.source')).toHaveTextContent('Source: Gran');
		expect(container.querySelector('.source a')).toBeNull();
	});

	test('no source, no line; a source is never part of the byline', () => {
		expect(withSource(null, null).container.querySelector('.source')).toBeNull();
		const { container } = withSource('Gran', null);
		expect(container.querySelector('.byline')).not.toHaveTextContent('Gran');
	});
});
