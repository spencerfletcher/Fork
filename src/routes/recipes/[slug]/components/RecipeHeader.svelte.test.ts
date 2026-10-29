import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import RecipeHeader from './RecipeHeader.svelte';
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
const THREE = [
	makeVersion(3, 'Chill the dough'),
	makeVersion(2, 'Add espresso powder'),
	makeVersion(1, 'Initial recipe')
];

function renderHeader(overrides: Partial<HeaderProps> = {}) {
	return render(RecipeHeader, {
		props: {
			recipe: makeRecipe(),
			currentVersion: V1,
			versions: [makeVersion(1, 'Initial recipe')],
			forkCount: 0,
			isViewingHistory: false,
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
	test('links to a visible parent with its author', () => {
		renderHeader({
			recipe: makeRecipe({
				parentId: 42,
				parent: { slug: 'original', title: 'The Original', author: { username: 'chef' } }
			})
		});
		expect(screen.getByRole('link', { name: 'The Original' })).toHaveAttribute(
			'href',
			'/recipes/original'
		);
		// Usernames are the same linked mono everywhere, this line included.
		expect(screen.getByRole('link', { name: '@chef' })).toHaveAttribute('href', '/users/chef');
	});

	test('says the parent is private when the server withheld it', () => {
		renderHeader({ recipe: makeRecipe({ parentId: 42, parent: null }) });
		expect(screen.getByText('Forked from a private recipe')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	test('shows no attribution for a recipe that is not a fork', () => {
		renderHeader();
		expect(screen.queryByText(/Forked from/)).not.toBeInTheDocument();
	});
});

// ─── The chip ─────────────────────────────────────────────────────────────────

describe('RecipeHeader chip', () => {
	test("shows the viewed version's title", () => {
		renderHeader();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Old Title');
	});

	test('the description sits under the byline, before the measure', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
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

	test('the byline carries one marigold chip, a badge with its meaning for screen readers', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		const chip = container.querySelector('.byline .version')!;
		expect(chip).toHaveTextContent('v3');
		expect(chip.tagName).not.toBe('BUTTON');
		expect(chip.querySelector('.sr-only')).toHaveTextContent('Version 3, the latest');
		// The commit message is not in the closed header: it lives in the history.
		expect(container.querySelector('.version-bar')).toBeNull();
		expect(screen.getByText('Chill the dough')).not.toBeVisible();
	});
});

// ─── The byline ───────────────────────────────────────────────────────────────

describe('RecipeHeader byline', () => {
	test('author, forks, chip and versions in one sans line; compare lives in the history', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } }),
			currentVersion: V3,
			versions: THREE,
			forkCount: 1
		});
		expect(byline(container)).toBe('By @chef · 1 fork · v3 · 3 versions');
		expect(container.querySelector('.byline a[href*="/diff"]')).toBeNull();
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
	});

	test('a single version: the byline is just the author; no count, no compare', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } })
		});
		expect(byline(container)).toBe('By @chef · v1');
		expect(container.querySelector('.byline .version')).toHaveTextContent('v1');
		expect(screen.queryByRole('button', { name: /versions/ })).toBeNull();
		expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
	});

	test('forks are plural and absent when there are none', () => {
		const { container, unmount } = renderHeader({ forkCount: 2 });
		expect(byline(container)).toContain('2 forks');
		unmount();
		const second = renderHeader({ forkCount: 0 });
		expect(byline(second.container)).not.toMatch(/fork/);
	});

	test('viewing an older version says so and offers the way back', async () => {
		const { container } = renderHeader({
			currentVersion: { ...V1, ...makeVersion(2, 'Add espresso powder') },
			versions: THREE,
			isViewingHistory: true
		});
		// The same chip and chevron as the latest, so the state is unmistakable.
		expect(byline(container)).toBe('v2 · v2 of 3 · Older version · Back to v3');
		expect(container.querySelector('.byline .version .sr-only')).toHaveTextContent(
			'Version 2 of 3, replaced'
		);
		expect(container.querySelector('.byline .chevron')).not.toBeNull();
		expect(screen.getByRole('link', { name: 'Back to v3' })).toHaveAttribute(
			'href',
			'/recipes/my-fork'
		);
		// The history is still reachable: "v2 of 3" opens every version. The one
		// being read keeps its chip and message; the others compare with it.
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		await fireEvent.click(screen.getByRole('button', { name: /v2 of 3/ }));
		expect(screen.getByText('Initial recipe')).toBeVisible();
		expect(screen.getByText('Add espresso powder')).toBeVisible();
		expect(screen.queryByRole('link', { name: 'v2' })).toBeNull();
		expect(container.querySelector('#version-history li.current .version')).toHaveTextContent('v2');
		const compares = screen.getAllByRole('link', { name: 'Compare with v2' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=2'
		]);
	});

	test('the version count opens every version: this one with its message, the others with a compare', async () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		expect(screen.getByText('Add espresso powder')).not.toBeVisible();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(screen.getByText('Add espresso powder')).toBeVisible();
		// The whole row, number and message, is the link to that version.
		expect(screen.getByRole('link', { name: 'v2 Add espresso powder' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=2'
		);
		// The version being read leads the list with its chip and message, no link, no compare.
		const current = container.querySelector('#version-history li.current')!;
		expect(current).toBe(container.querySelector('#version-history li'));
		expect(current.querySelector('.version')).toHaveTextContent('v3');
		expect(current).toHaveTextContent('Chill the dough');
		expect(current.querySelector('a')).toBeNull();
		expect(screen.queryByRole('link', { name: 'v3' })).toBeNull();
		expect(container.querySelectorAll('#version-history li')).toHaveLength(3);
		const compares = screen.getAllByRole('link', { name: 'Compare with v3' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=3'
		]);
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
		// Taxonomy, not history: the body face, quiet, under the measure.
		expect(dessert.parentElement).toHaveClass('font-sans', 'text-text-2');
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
			versions: THREE,
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
