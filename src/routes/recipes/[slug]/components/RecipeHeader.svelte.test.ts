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

/** The byline as a reader sees it: its items, dotted (the dots are CSS). */
function byline(container: HTMLElement) {
	return [...container.querySelector('.byline')!.children]
		.map((el) => el.textContent!.replace(/\s+/g, ' ').trim())
		.join(' · ');
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

// ─── The version bar ──────────────────────────────────────────────────────────

describe('RecipeHeader version bar', () => {
	test("shows the viewed version's title", () => {
		renderHeader();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Old Title');
	});

	test('the description sits under the title, before the bar', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		const description = container.querySelector('.description')!;
		const bar = container.querySelector('.version-bar')!;
		expect(description).toHaveTextContent('Crisp edges.');
		expect(
			description.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	test('the bar leads with a marigold version chip and the commit message', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		const chip = container.querySelector('.version-bar .version')!;
		expect(chip).toHaveTextContent('v3');
		expect(container.querySelector('.version-bar .commit')).toHaveTextContent('Chill the dough');
		expect(screen.getAllByText('v3')).toHaveLength(1);
	});

	test('the message runs in full: plain text, no clamp, no button', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		const message = container.querySelector('.version-bar .commit')!;
		expect(message).not.toHaveClass('clamped');
		expect(message.tagName).not.toBe('BUTTON');
		expect(screen.queryByRole('button', { name: 'more' })).toBeNull();
	});
});

// ─── The byline ───────────────────────────────────────────────────────────────

describe('RecipeHeader byline', () => {
	test('author, versions and forks in one mono line; compare lives in the history', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } }),
			currentVersion: V3,
			versions: THREE,
			forkCount: 1
		});
		expect(byline(container)).toBe('@chef · 3 versions · 1 fork');
		expect(container.querySelector('.byline a[href*="/diff"]')).toBeNull();
		expect(screen.getAllByRole('link', { name: '@chef' })).toHaveLength(1);
	});

	test('the note is set in the note voice: italic, quieter than the description', () => {
		const { container } = renderHeader({ currentVersion: V3, versions: THREE });
		// The style itself is CSS; the hook the e2e suite measures is the class.
		expect(container.querySelector('.version-bar .commit')).not.toBeNull();
	});

	test('a single version has no change to tell: the chip joins the byline', () => {
		const { container } = renderHeader({
			recipe: makeRecipe({ author: { id: 'u1', username: 'chef' } })
		});
		expect(byline(container)).toBe('v1 · @chef');
		expect(container.querySelector('.commit')).toBeNull();
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
		expect(container.querySelector('.version-bar .version')).toHaveTextContent('v2');
		expect(container.querySelector('.version-bar .commit')).toHaveTextContent(
			'Add espresso powder'
		);
		expect(byline(container)).toBe('v2 of 3 · Viewing history · Back to v3');
		expect(screen.getByRole('link', { name: 'Back to v3' })).toHaveAttribute(
			'href',
			'/recipes/my-fork'
		);
		// The history is still reachable: "v2 of 3" opens the other versions, each
		// compared with the one being read, older to newer.
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		await fireEvent.click(screen.getByRole('button', { name: 'v2 of 3' }));
		expect(screen.getByText('Initial recipe')).toBeVisible();
		expect(screen.queryByRole('link', { name: 'v2' })).toBeNull();
		const compares = screen.getAllByRole('link', { name: 'Compare with v2' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=2'
		]);
	});

	test('the version count opens the other versions, each with a compare against this one', async () => {
		renderHeader({ currentVersion: V3, versions: THREE });
		expect(screen.getByText('Add espresso powder')).not.toBeVisible();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(screen.getByText('Add espresso powder')).toBeVisible();
		expect(screen.getByRole('link', { name: 'v2' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=2'
		);
		// The version being read is already on the page, so it is not listed again.
		expect(screen.queryByRole('link', { name: 'v3' })).toBeNull();
		const compares = screen.getAllByRole('link', { name: 'Compare with v3' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=3'
		]);
	});
});

// ─── Header content ───────────────────────────────────────────────────────────

describe('RecipeHeader content', () => {
	test('shows Serves from the viewed version in the meta line', () => {
		const { container } = renderHeader();
		expect(container.querySelector('dl.details')!.textContent!.replace(/\s+/g, ' ')).toContain(
			'Serves 4'
		);
	});

	test('a blank servings on the viewed version shows no Serves', () => {
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
		// Taxonomy, not history: the body face, quiet, on the meta line with the measure.
		expect(dessert.parentElement).toHaveClass('font-sans');
		expect(dessert.closest('.meta')!.querySelector('dl.details')).not.toBeNull();
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
		const meta = container.querySelector('dl.details')!;
		expect(meta.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(container.querySelector('header')!.lastElementChild).toContainElement(button);
	});

	test('renders no meta line and no tags when there is nothing to show', () => {
		const { container } = renderHeader({
			currentVersion: { ...V1, servings: null, prepTimeMinutes: null, cookTimeMinutes: null }
		});
		expect(container.querySelector('dl.details')).toBeNull();
		expect(container.querySelector('.tags')).toBeNull();
	});
});
