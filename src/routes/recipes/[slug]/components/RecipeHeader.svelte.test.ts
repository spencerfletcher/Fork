import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import RecipeHeader from './RecipeHeader.svelte';
import source from './RecipeHeader.svelte?raw';
import type { ComponentProps } from 'svelte';
import { makeContent, makeVersion } from '#lib/recipes/fixtures.js';

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
			versionCount: 1,
			tags: [],
			...overrides
		}
	});
}

/** The byline as a reader sees it: sr-only prefixes dropped, whitespace collapsed. */
function byline(container: HTMLElement) {
	const copy = container.querySelector('.byline')!.cloneNode(true) as HTMLElement;
	copy.querySelectorAll('.sr-only').forEach((el) => el.remove());
	return copy.textContent!.replace(/\s+/g, ' ').trim();
}

// ─── Fork attribution ─────────────────────────────────────────────────────────

describe('RecipeHeader fork attribution', () => {
	// Decided 29 October 2026: the fork info folds into the byline, there is no
	// attribution line, and the parent's author is not named (it is one click
	// away on the parent).
	test('a fork says so in the byline, linking the parent without its author', () => {
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
	// Spencer, 31 October 2026: "I like the stats row 1b". Forks and versions,
	// each an icon and its words; the words carry the meaning, the icons are
	// decoration. The save count moved onto the Save pill (9 Nov 2026).
	const stats = (container: HTMLElement) =>
		[...container.querySelectorAll('.stats > *')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);

	test('reads forks then versions, under the tags: description, measure, tags, stats', () => {
		const { container } = renderHeader({
			currentVersion: V3,
			forkCount: 2,
			versionCount: 3,
			tags: [{ id: 1, name: 'Baking', slug: 'baking' }]
		});
		expect(stats(container)).toEqual(['2 forks', '3 versions']);
		const order = ['.byline', '.description', '.details', '.tags', '.stats'].map((selector) =>
			container.querySelector(selector)!
		);
		for (let i = 1; i < order.length; i++) {
			expect(
				order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		}
	});

	test('one of each is singular', () => {
		const { container } = renderHeader({ forkCount: 1, versionCount: 1 });
		expect(stats(container)).toEqual(['1 fork', '1 version']);
	});

	test('none says so in words, and an empty count is not a link', () => {
		const { container } = renderHeader({ forkCount: 0, versionCount: 1 });
		expect(stats(container)).toEqual(['No forks', '1 version']);
		expect(container.querySelector('.stats a')).toBeNull();
	});

	test('the fork count links to the list of forks', () => {
		renderHeader({ forkCount: 2, recipe: makeRecipe({ slug: 'classic-cookies' }) });
		expect(screen.getByRole('link', { name: '2 forks' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies/forks'
		);
	});

	test('the version count links to the version bar, which only exists with two or more', () => {
		renderHeader({ versionCount: 3 });
		expect(screen.getByRole('link', { name: '3 versions' })).toHaveAttribute('href', '#versions');
	});

	test('cooking hides the version bar, so the version count is not a link to it', () => {
		const { container } = renderHeader({ versionCount: 3, cooking: true });
		expect(screen.queryByRole('link', { name: '3 versions' })).toBeNull();
		expect(stats(container)).toContain('3 versions');
	});

	test('says nothing of saves or favorites: the count is on the Save pill', () => {
		const { container } = renderHeader({ forkCount: 2, versionCount: 3 });
		expect(container.querySelector('.stats')!.textContent).not.toMatch(/save|favorite/i);
	});

	test('each item carries a 16px icon hidden from assistive tech', () => {
		const { container } = renderHeader({ forkCount: 2, versionCount: 3 });
		const icons = container.querySelectorAll('.stats svg');
		expect(icons).toHaveLength(2);
		for (const icon of icons) {
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).toHaveClass('size-4');
		}
	});

	// Line art in one 1.5 stroke on a 16px box (decided 9 November 2026): the
	// fork a handle and four single-stroke prongs, versions a stack of pages.
	test('the icons are line art: one 1.5 stroke, no dots or fills, and distinct', () => {
		const { container } = renderHeader({ forkCount: 2, versionCount: 3 });
		const [fork, versions] = container.querySelectorAll('.stats svg');
		for (const icon of [fork, versions]) {
			expect(icon).toHaveAttribute('viewBox', '0 0 16 16');
			expect(icon).toHaveAttribute('stroke-width', '1.5');
			expect(icon).toHaveAttribute('fill', 'none');
			expect(icon.querySelectorAll('circle, [fill]:not(svg)')).toHaveLength(0);
		}
		// Every stroke is a straight line: no arcs or curves.
		const d = (icon: Element) => [...icon.querySelectorAll('path')].map((p) => p.getAttribute('d'));
		for (const path of [...d(fork), ...d(versions)]) expect(path).toMatch(/^[MmHhVv\d.\s-]+$/);
		// The fork: four prongs, a crossbar and a handle, each its own stroke.
		expect(d(fork).join(' ').match(/M/g)).toHaveLength(6);
		expect(d(versions)).not.toEqual(d(fork));
	});

	test('the row takes the byline size, so the header keeps one metadata size', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const rule = (name: string) =>
			source.match(new RegExp(`\\n\\t\\.${name} \\{[^}]*\\}`))?.[0] ?? '';
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
		const { container } = renderHeader();
		expect(screen.getByRole('heading', { level: 1 })).toHaveClass('[overflow-wrap:anywhere]');
		expect(container.querySelector('.byline')).toHaveClass('[overflow-wrap:anywhere]');
	});

	test('says the serves from the content it is given in the measure line, as plain text', () => {
		const { container } = renderHeader();
		expect(container.querySelector('.details')!.textContent!.replace(/\s+/g, ' ')).toContain(
			'Serves 4'
		);
		expect(container.querySelector('header input, header button')).toBeNull();
	});

	test('hands the stored serves to the measure, so scaled serves read clay', () => {
		renderHeader({ currentVersion: { ...V1, servings: 12 }, storedServings: 3 });
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
		// like every other link on the site, clay and bold, the commas quiet.
		expect(dessert.parentElement).toHaveClass('font-sans', 'text-text-2');
		expect(dessert).toHaveClass('text-accent', 'font-semibold');
		const details = dessert.closest('header')!.querySelector('.details')!;
		expect(
			dessert.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_PRECEDING
		).toBeTruthy();
	});

	test('the description clamps at three lines with an ellipsis at every width', () => {
		// jsdom applies no component CSS, so the clamp is read from the source:
		// on the .description rule itself, not inside a media query.
		const rule = source.match(/\n\t\.description \{[^}]*\}/)?.[0] ?? '';
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

	test('a reader who logged it: the date links to that entry, then Add to Journal', () => {
		const { container } = renderHeader({
			journal: { lastEntry: { id: 12, cookedOn: '2026-11-08' }, addHref: ADD }
		});
		const line = container.querySelector('.personal')!;
		expect(line.textContent!.replace(/\s+/g, ' ').trim()).toBe(
			'You cooked this on Sun 8 Nov · Add to Journal'
		);
		expect(screen.getByRole('link', { name: 'Sun 8 Nov' })).toHaveAttribute(
			'href',
			'/journal#entry-12'
		);
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute('href', ADD);
	});

	test('never logged: Add to Journal alone; signed out or cooking: no line', () => {
		const first = renderHeader({ journal: { lastEntry: null, addHref: ADD } });
		expect(first.container.querySelector('.personal')!.textContent!.trim()).toBe('Add to Journal');
		first.unmount();

		const signedOut = renderHeader({ journal: null });
		expect(signedOut.container.querySelector('.personal')).toBeNull();
		signedOut.unmount();

		const cooking = renderHeader({ journal: { lastEntry: null, addHref: ADD }, cooking: true });
		expect(cooking.container.querySelector('.personal')).toBeNull();
	});
});
