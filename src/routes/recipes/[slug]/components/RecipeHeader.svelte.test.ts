import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import RecipeHeader from './RecipeHeader.svelte';
import source from './RecipeHeader.svelte?raw';
import type { ComponentProps } from 'svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HeaderProps = ComponentProps<typeof RecipeHeader>;

function makeRecipe(overrides: Partial<HeaderProps['recipe']> = {}): HeaderProps['recipe'] {
	return { slug: 'my-fork', parentId: null, parent: null, ...overrides };
}

function makeVersion(versionNumber: number, commitMessage: string) {
	return { id: versionNumber, versionNumber, commitMessage };
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
				parent: { slug: 'original', title: 'The Original', author: { username: 'chef' } }
			})
		});
		expect(byline(container)).toBe('By @me · forked from The Original');
		const parent = screen.getByRole('link', { name: 'The Original' });
		expect(parent).toHaveAttribute('href', '/recipes/original');
		expect(container.querySelector('.byline')).toContainElement(parent);
		expect(screen.queryByRole('link', { name: '@chef' })).not.toBeInTheDocument();
		expect(container.querySelector('.attribution')).toBeNull();
	});

	test('its own forks come before the parent, and only when there are any', () => {
		const { container } = renderHeader({
			forkCount: 2,
			recipe: makeRecipe({
				author: { id: 'u1', username: 'me' },
				parentId: 42,
				parent: { slug: 'original', title: 'The Original' }
			})
		});
		expect(byline(container)).toBe('By @me · 2 forks · forked from The Original');
	});

	test('says the parent is private when the server withheld it', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'me' }, parentId: 42, parent: null })
		});
		expect(byline(container)).toBe('By @me · forked from a private recipe');
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
	test('author and forks in one sans line; the version and its history live in the bar', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } }),
			currentVersion: V3,
			forkCount: 1
		});
		expect(byline(container)).toBe('By @chef · 1 fork');
		expect(container.querySelector('.byline a[href*="/diff"]')).toBeNull();
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
	});

	test('the handle keeps the Username face: the byline overrides neither its family nor its size', () => {
		// "By" is sans, "@author" is mono clay at the byline's size, "· 1 fork"
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

	test('forks are plural and absent when there are none', () => {
		const { container, unmount } = renderHeader({ forkCount: 2 });
		expect(byline(container)).toContain('2 forks');
		unmount();
		const second = renderHeader({ forkCount: 0 });
		expect(byline(second.container)).not.toMatch(/fork/);
	});
});

// ─── Header content ───────────────────────────────────────────────────────────

describe('RecipeHeader content', () => {
	test('shows the servings from the viewed version in the measure line', () => {
		const { container } = renderHeader();
		expect(container.querySelector('.details')!.textContent!.replace(/\s+/g, ' ')).toContain(
			'4 servings'
		);
	});

	test('a blank servings on the viewed version shows no servings', () => {
		renderHeader({ currentVersion: { ...V1, servings: null } });
		expect(screen.queryByText(/servings/)).toBeNull();
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
		// Taxonomy, not history: the body face under the measure; each tag a link
		// like every other link on the site, clay and bold, the commas quiet.
		expect(dessert.parentElement).toHaveClass('font-sans', 'text-text-2');
		expect(dessert).toHaveClass('text-accent', 'font-semibold');
		const details = dessert.closest('header')!.querySelector('.details')!;
		expect(
			details.compareDocumentPosition(dessert) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
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
