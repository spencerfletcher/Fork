import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import DiffPage from './+page.svelte';

// ─── SvelteKit module mocks ───────────────────────────────────────────────────

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

vi.mock('$app/stores', () => ({
	page: readable({ url: new URL('http://localhost/'), params: {}, route: { id: null } }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECIPE = { id: 1, slug: 'classic-cookies', title: 'Classic Chocolate Chip Cookies' };

const V1 = { versionNumber: 1, commitMessage: 'Initial recipe', creator: null, createdAt: new Date() };
const V2 = { versionNumber: 2, commitMessage: 'Added espresso powder', creator: null, createdAt: new Date() };

function makeData(overrides: {
	ingredientDiff?: { status: string; ingredient: { amount: string; unit: string; name: string } }[];
	stepDiff?: { status: string; step: { step: number; text: string } }[];
} = {}) {
	return {
		recipe: RECIPE,
		fromVersion: V1,
		toVersion: V2,
		allVersions: [V1, V2],
		ingredientDiff: overrides.ingredientDiff ?? [],
		stepDiff: overrides.stepDiff ?? [],
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Diff page', () => {
	test('renders the recipe title', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByText('Classic Chocolate Chip Cookies')).toBeInTheDocument();
	});

	test('renders the h1 "Compare versions" heading', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Compare versions');
	});

	test('shows commit messages for both versions', () => {
		render(DiffPage, { props: { data: makeData() } });
		expect(screen.getByText('Initial recipe')).toBeInTheDocument();
		expect(screen.getByText('Added espresso powder')).toBeInTheDocument();
	});

	test('renders "+" prefix for added ingredients', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'added', ingredient: { amount: '1', unit: 'tsp', name: 'espresso powder' } }],
		});
		const { container } = render(DiffPage, { props: { data } });
		const content = container.querySelector('.diff-added .diff-content');
		expect(content?.textContent).toContain('espresso powder');
		expect(screen.getByText('+')).toBeInTheDocument();
	});

	test('renders "−" prefix for removed ingredients', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'removed', ingredient: { amount: '2', unit: 'cups', name: 'butter' } }],
		});
		const { container } = render(DiffPage, { props: { data } });
		const content = container.querySelector('.diff-removed .diff-content');
		expect(content?.textContent).toContain('butter');
		expect(screen.getByText('−')).toBeInTheDocument();
	});

	test('added row has diff-added class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'added', ingredient: { amount: '1', unit: 'tsp', name: 'vanilla' } }],
		});
		const { container } = render(DiffPage, { props: { data } });
		expect(container.querySelector('.diff-added')).not.toBeNull();
	});

	test('removed row has diff-removed class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'removed', ingredient: { amount: '1', unit: 'tsp', name: 'vanilla' } }],
		});
		const { container } = render(DiffPage, { props: { data } });
		expect(container.querySelector('.diff-removed')).not.toBeNull();
	});

	test('unchanged row has diff-unchanged class', () => {
		const data = makeData({
			ingredientDiff: [{ status: 'unchanged', ingredient: { amount: '2', unit: 'cups', name: 'flour' } }],
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
			stepDiff: [{ status: 'added', step: { step: 3, text: 'Stir in chips.' } }],
		});
		const { container } = render(DiffPage, { props: { data } });
		// Step number circle should render inside the diff row
		const stepNum = container.querySelector('.step-num');
		expect(stepNum).not.toBeNull();
		expect(stepNum!.textContent?.trim()).toBe('3');
	});

	test('removed step row does not show a step number circle', () => {
		const data = makeData({
			stepDiff: [{ status: 'removed', step: { step: 2, text: 'Old step.' } }],
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

	test('renders the back link to the recipe page', () => {
		render(DiffPage, { props: { data: makeData() } });
		const backLink = screen.getByRole('link', { name: /back to recipe/i });
		expect(backLink).toHaveAttribute('href', '/recipes/classic-cookies');
	});
});
