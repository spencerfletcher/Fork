import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import DiffPage from './+page.svelte';
import source from './+page.svelte?raw';
import type { IngredientDiffRow, MetaDiffRow, StepDiffRow } from '#lib/recipes/diff.js';
import { makeContent, makeIngredient as ing } from '#lib/recipes/fixtures.js';

// ─── SvelteKit module mocks ───────────────────────────────────────────────────

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/'), params: {}, route: { id: null } }
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECIPE = { id: 1, slug: 'classic-cookies', title: 'Classic Chocolate Chip Cookies' };

const SNAPSHOT = makeContent({
	title: 'Classic Chocolate Chip Cookies',
	servings: 48,
	prepTimeMinutes: null,
	cookTimeMinutes: 11,
	ingredients: [ing('2 cups flour'), ing('1 tsp salt')]
});
const V1 = {
	versionNumber: 1,
	commitMessage: 'Initial recipe',
	creator: null as { id: string; username: string } | null,
	createdAt: new Date(2026, 1, 28) as Date | null,
	...SNAPSHOT
};
const V2 = {
	versionNumber: 2,
	commitMessage: 'Added espresso powder',
	creator: null as { id: string; username: string } | null,
	createdAt: new Date(2026, 1, 28) as Date | null,
	...SNAPSHOT
};

function makeData(
	overrides: {
		metaDiff?: MetaDiffRow[];
		ingredientDiff?: IngredientDiffRow[];
		stepDiff?: StepDiffRow[];
		fromVersion?: typeof V1;
		toVersion?: typeof V1;
		allVersions?: (typeof V1)[];
	} = {}
) {
	return {
		recipe: RECIPE,
		fromVersion: overrides.fromVersion ?? V1,
		toVersion: overrides.toVersion ?? V2,
		allVersions: overrides.allVersions ?? [V1, V2],
		metaDiff: overrides.metaDiff ?? [],
		ingredientDiff: overrides.ingredientDiff ?? [],
		stepDiff: overrides.stepDiff ?? [],
		user: null
	} as never;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Diff page', () => {
	test('renders the h1 "Compare Versions" heading', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Compare Versions');
	});

	test('shows commit messages for both versions', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByText('Initial recipe')).toBeInTheDocument();
		expect(screen.getByText('Added espresso powder')).toBeInTheDocument();
	});

	test('renders "+" prefix for added ingredients', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'added', ingredient: ing('1 tsp espresso powder') }]
		});
		const { container } = render(DiffPage, { props: { data } });
		const content = container.querySelector('.diff-added .diff-content');
		expect(content?.textContent).toContain('espresso powder');
		expect(screen.getByText('+')).toBeInTheDocument();
	});

	test('renders "−" prefix for removed ingredients', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'removed', ingredient: ing('2 cups butter') }]
		});
		const { container } = render(DiffPage, { props: { data } });
		const content = container.querySelector('.diff-removed .diff-content');
		expect(content?.textContent).toContain('butter');
		expect(screen.getByText('−')).toBeInTheDocument();
	});

	test('added row has diff-added class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'added', ingredient: ing('1 tsp vanilla') }]
		});
		const { container } = render(DiffPage, { props: { data } });
		expect(container.querySelector('.diff-added')).not.toBeNull();
	});

	test('removed row has diff-removed class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'removed', ingredient: ing('1 tsp vanilla') }]
		});
		const { container } = render(DiffPage, { props: { data } });
		expect(container.querySelector('.diff-removed')).not.toBeNull();
	});

	test('unchanged row has diff-unchanged class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'unchanged', ingredient: ing('2 cups flour') }]
		});
		const { container } = render(DiffPage, { props: { data } });
		expect(container.querySelector('.diff-unchanged')).not.toBeNull();
	});

	test('shows "No changes" when ingredient diff is empty', () => {
		render(DiffPage, { props: { data: makeData({ ingredientDiff: [] }) } });
		// There are two "No changes" — one per section
		const noChanges = screen.getAllByText('No changes');
		expect(noChanges.length).toBeGreaterThanOrEqual(1);
	});

	test('added step row shows the step number', () => {
		const data = makeData({
			stepDiff: [{ status: 'added', stepNumber: 3, step: { text: 'Stir in chips.' } }]
		});
		const { container } = render(DiffPage, { props: { data } });
		// Step number circle should render inside the diff row
		const stepNum = container.querySelector('.step-num');
		expect(stepNum).not.toBeNull();
		// The number ends in an unseen stop so a screen reader does not run it
		// into the text: "3. Stir in chips." rather than "3 Stir in chips".
		expect(stepNum!.textContent?.trim()).toBe('3.');
	});

	test('removed step row does not show a step number circle', () => {
		const data = makeData({
			stepDiff: [{ status: 'removed', step: { text: 'Old step.' } }]
		});
		const { container } = render(DiffPage, { props: { data } });
		// Per the component: {#if row.status !== 'removed'}<span class="step-num">
		expect(container.querySelector('.step-num')).toBeNull();
	});

	test('version selectors are populated with all versions', () => {
		render(DiffPage, { props: { data: makeData() } });
		// Two selects: From and To
		const selects = screen.getAllByRole('combobox');
		expect(selects).toHaveLength(2);
		// Each select should have 2 options (v1 and v2)
		expect(selects[0].querySelectorAll('option')).toHaveLength(2);
		expect(selects[1].querySelectorAll('option')).toHaveLength(2);
	});

	test('the back link is the recipe title and leads to the recipe', () => {
		render(DiffPage, { props: { data: makeData() } });
		const backLink = screen.getByRole('link', { name: /Classic Chocolate Chip Cookies/ });
		expect(backLink).toHaveAttribute('href', '/recipes/classic-cookies');
	});

	test('each version card shows its number, date and message, and none of the facts', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		const cards = container.querySelectorAll('article.version-card');
		expect(cards).toHaveLength(2);
		expect(cards[0]).toHaveTextContent('v1');
		expect(cards[0]).toHaveTextContent('28 Feb 2026');
		expect(cards[0]).toHaveTextContent('Initial recipe');
		// The title, servings and times live in the Details panel with their
		// del/ins; stating them again in the cards said each three times
		// (decided 29 October 2026).
		expect(cards[0]).not.toHaveTextContent('Classic Chocolate Chip Cookies');
		expect(cards[0]).not.toHaveTextContent('servings');
		expect(cards[0]).not.toHaveTextContent('cook');
		expect(cards[0].querySelector('dl, .version-card__measure')).toBeNull();
		expect(cards[1]).toHaveClass('version-card--to');
		expect(cards[1].querySelector('.version-card__message')).toBeInTheDocument();
	});

	test('each card number links to its version, the latest to the plain recipe URL', () => {
		const V3 = { ...V2, versionNumber: 3, commitMessage: 'Less sugar' };
		const { container } = render(DiffPage, {
			props: { data: makeData({ allVersions: [V1, V2, V3] }) }
		});
		const numbers = container.querySelectorAll('article.version-card a.version-card__number');
		expect(numbers).toHaveLength(2);
		expect(numbers[0]).toHaveTextContent('v1');
		expect(numbers[0]).toHaveAttribute('href', '/recipes/classic-cookies?version=1');
		expect(numbers[1]).toHaveAttribute('href', '/recipes/classic-cookies?version=2');
	});

	test('the To card number is a link to the latest version when it is the latest', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		const to = container.querySelector('article.version-card--to a.version-card__number');
		expect(to).toHaveAttribute('href', '/recipes/classic-cookies');
	});

	test('there is no summary line under the h1', () => {
		const { container } = render(DiffPage, {
			props: {
				data: makeData({
					metaDiff: [{ field: 'servings', from: 4, to: 8 }],
					ingredientDiff: [{ status: 'added', ingredient: ing('1 tsp salt') }]
				})
			}
		});
		expect(container.querySelector('.summary')).toBeNull();
		expect(screen.queryByText(/changed$/)).toBeNull();
	});

	test('a card without a creator or a date shows neither, with no stray separator', () => {
		const { container } = render(DiffPage, {
			props: { data: makeData({ fromVersion: { ...V1, createdAt: null, creator: null } }) }
		});
		const header = container.querySelector('article.version-card .version-card__head');
		expect(header?.textContent?.replace(/\s+/g, ' ').trim()).toBe('v1');
	});

	test('a card links its creator, then the date', () => {
		const { container } = render(DiffPage, {
			props: {
				data: makeData({ fromVersion: { ...V1, creator: { id: 'u1', username: 'chef' } } })
			}
		});
		const head = container.querySelector('article.version-card .version-card__head')!;
		expect(head.textContent?.replace(/\s+/g, ' ').trim()).toBe('v1 @chef · 28 Feb 2026');
		expect(head.querySelector('.username')).toHaveAttribute('href', '/users/chef');
	});

	test("the card's username keeps Username's own step under the line, not the line's size", () => {
		// Username sets itself 0.9375em of the line it sits in; a page rule
		// giving it a size of its own flattens that ratio to 1. jsdom applies no
		// component CSS, so the page's rules are read from the source; the e2e
		// in compare.test.ts measures the ratio.
		const style = source.slice(source.indexOf('<style>'));
		const usernameRules = [...style.matchAll(/[^{}]*\.username\)?\s*{[^}]*}/g)].map((m) => m[0]);
		expect(usernameRules.length).toBeGreaterThan(0);
		for (const rule of usernameRules) expect(rule).not.toMatch(/font-size/);
	});

	test("shows the date in the viewer's own day", () => {
		// Just after midnight UTC on the 28th is still the 27th in the test zone
		// (America/Los_Angeles, pinned in vite.config.ts).
		const { container } = render(DiffPage, {
			props: {
				data: makeData({
					fromVersion: { ...V1, createdAt: new Date(Date.UTC(2026, 1, 28, 0, 30)) }
				})
			}
		});
		expect(container.querySelector('article.version-card .version-card__head')).toHaveTextContent(
			'27 Feb 2026'
		);
	});

	test('every text in a card may break anywhere, so a long title cannot widen it', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		expect(container.querySelector('article.version-card')).toHaveClass('version-card');
		// jsdom computes no layout; the e2e in authenticated.test.ts measures it.
	});

	test('the diff panels are h2, directly under the page h1', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByRole('heading', { level: 2, name: 'Ingredients' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
	});

	test('the stacked commit bar is gone', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		expect(container.querySelector('.commit-bar')).toBeNull();
	});

	test('the same version on both sides says so and renders no diff panels', () => {
		const { container } = render(DiffPage, {
			props: { data: makeData({ fromVersion: V2, toVersion: V2 }) }
		});
		expect(screen.getByText('v2 is on both sides; pick another version.')).toBeInTheDocument();
		expect(container.querySelector('.diff-panel')).toBeNull();
		expect(container.querySelector('.summary')).toBeNull();
		expect(screen.queryByRole('link', { name: 'Read v2' })).toBeNull();
	});

	test('after the last row a link reads the To version, plain when it is the latest', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByRole('link', { name: 'Read v2' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies'
		);
	});

	test('the Read link names the version when To is not the latest', () => {
		const V3 = { ...V2, versionNumber: 3, commitMessage: 'Less sugar' };
		render(DiffPage, { props: { data: makeData({ allVersions: [V1, V2, V3] }) } });
		expect(screen.getByRole('link', { name: 'Read v2' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies?version=2'
		);
	});

	test('version pickers follow the loaded range, e.g. after back/forward navigation', async () => {
		const V3 = { ...V2, versionNumber: 3, commitMessage: 'Less sugar' };
		const versions = [V1, V2, V3];
		const { rerender } = render(DiffPage, {
			props: { data: makeData({ allVersions: versions }) }
		});

		await rerender({
			data: makeData({ allVersions: versions, fromVersion: V2, toVersion: V3 })
		});

		expect(screen.getByLabelText('From version')).toHaveValue('2');
		expect(screen.getByLabelText('To version')).toHaveValue('3');
	});

	// The select is the only thing drawn: its options are short while the list
	// is closed and carry the message while it is open (decided 29 October 2026).
	const labels = (select: HTMLElement) =>
		[...select.querySelectorAll('option')].map((o) => o.textContent);
	const SHORT = [`v${V1.versionNumber}`, `v${V2.versionNumber}`];
	const LONG = [
		`v${V1.versionNumber} · ${V1.commitMessage}`,
		`v${V2.versionNumber} · ${V2.commitMessage}`
	];

	test('a closed picker shows only the version, drawn by the select itself, with an unseen caret', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		const from = screen.getByRole('combobox', { name: 'From version' });
		expect(labels(from)).toEqual(SHORT);
		expect(container.querySelector('.picker__face')).toBeNull();
		const carets = [...container.querySelectorAll('.picker__caret')];
		expect(carets).toHaveLength(2);
		for (const caret of carets) expect(caret).toHaveAttribute('aria-hidden', 'true');
	});

	test('pressing a picker opens its list with each message; choosing or leaving closes it', async () => {
		render(DiffPage, { props: { data: makeData() } });
		const from = screen.getByRole('combobox', { name: 'From version' });
		const to = screen.getByRole('combobox', { name: 'To version' });
		await fireEvent.pointerDown(from);
		expect(labels(from)).toEqual(LONG);
		// Only the pressed picker opens.
		expect(labels(to)).toEqual(SHORT);
		await fireEvent.change(from, { target: { value: String(V2.versionNumber) } });
		expect(labels(from)).toEqual(SHORT);
		await fireEvent.pointerDown(from);
		await fireEvent.blur(from);
		expect(labels(from)).toEqual(SHORT);
		await fireEvent.pointerDown(from);
		await fireEvent.keyDown(from, { key: 'Escape' });
		expect(labels(from)).toEqual(SHORT);
	});

	test.each([
		['Space', { key: ' ' }],
		['Enter', { key: 'Enter' }],
		['Alt+ArrowDown', { key: 'ArrowDown', altKey: true }]
	])('%s opens the list with each message', async (_name, key) => {
		render(DiffPage, { props: { data: makeData() } });
		const to = screen.getByRole('combobox', { name: 'To version' });
		await fireEvent.keyDown(to, key);
		expect(labels(to)).toEqual(LONG);
	});

	test('focus alone, or ArrowDown without Alt, keeps the short labels', async () => {
		// The page refocuses the picker after navigating; its face must read "v2".
		render(DiffPage, { props: { data: makeData() } });
		const to = screen.getByRole('combobox', { name: 'To version' });
		await fireEvent.focus(to);
		await fireEvent.keyDown(to, { key: 'ArrowDown' });
		expect(labels(to)).toEqual(SHORT);
	});

	test('no From and To eyebrows: the selects are named, and the arrow between them is unseen', () => {
		const { container } = render(DiffPage, { props: { data: makeData() } });
		expect(container.querySelector('label')).toBeNull();
		expect(screen.queryByText('From', { exact: true })).toBeNull();
		expect(screen.getByRole('combobox', { name: 'To version' })).toBeInTheDocument();
		expect(container.querySelector('.version-picker__arrow')).toHaveAttribute(
			'aria-hidden',
			'true'
		);
	});
	test('the To chip keeps a box in forced colours: a transparent 1px border inside its 6px', () => {
		// Forced colours strip the marigold fill; the border is what remains, as
		// on the primary button. Padding gives up the border's pixel so the chip
		// keeps its width.
		const style = source.slice(source.indexOf('<style>'));
		const chip = style.match(/\.version-card--to \.version-card__number\s*{([^}]*)}/)?.[1] ?? '';
		expect(chip).toMatch(/border:\s*1px solid transparent/);
		expect(chip).toMatch(/padding:\s*0 5px/);
		// The chip is a flex item, so its border would grow the card's head by 2px
		// and drop the To message below the From one; the margin takes it back.
		expect(chip).toMatch(/margin-block:\s*-1px/);
	});
});
