import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import VersionDiff from './VersionDiff.svelte';
import type { IngredientDiffRow, StepDiffRow } from '#lib/recipes/diff.js';
import { makeIngredient } from '#lib/recipes/fixtures.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ingredient(name: string, amount = '1', unit = 'cup') {
	return makeIngredient(`${amount} ${unit} ${name}`);
}

function renderDiff(ingredientDiff: IngredientDiffRow[] = [], stepDiff: StepDiffRow[] = []) {
	return render(VersionDiff, { props: { ingredientDiff, stepDiff } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VersionDiff', () => {
	test('renders an Ingredients and a Steps section', () => {
		renderDiff();
		expect(screen.getByText('Ingredients')).toBeInTheDocument();
		expect(screen.getByText('Steps')).toBeInTheDocument();
	});

	test('says "No changes" in each empty section', () => {
		renderDiff();
		expect(screen.getAllByText('No changes')).toHaveLength(2);
	});

	test('marks an added ingredient with + and the add colour', () => {
		const { container } = renderDiff([
			{ status: 'added', ingredient: ingredient('flour', '2') } as IngredientDiffRow
		]);
		const row = container.querySelector('.diff-added');
		// The gutter glyph is what distinguishes added from removed for anyone
		// who cannot rely on colour alone.
		expect(row?.querySelector('.diff-gutter')?.textContent?.trim()).toBe('+');
		expect(row?.textContent).toContain('flour');
		// Colour comes from a stylesheet, which jsdom does not apply — the real
		// contrast is asserted in a browser by e2e/recipe.test.ts. Here we assert
		// the status class the stylesheet keys off.
		expect(row).toHaveClass('diff-row');
	});

	test('marks a removed ingredient with a minus sign and strikes it through', () => {
		const { container } = renderDiff([
			{ status: 'removed', ingredient: ingredient('butter') } as IngredientDiffRow
		]);
		const row = container.querySelector('.diff-removed');
		expect(row?.querySelector('.diff-gutter')?.textContent?.trim()).toBe('−');
		expect(row?.textContent).toContain('butter');
		expect(row).toHaveClass('diff-row');
	});

	test('renders an unchanged ingredient without add or remove styling', () => {
		const { container } = renderDiff([
			{ status: 'unchanged', ingredient: ingredient('salt') } as IngredientDiffRow
		]);
		expect(container.querySelector('.diff-unchanged')).toBeInTheDocument();
		expect(container.querySelector('.diff-added')).toBeNull();
		expect(container.querySelector('.diff-removed')).toBeNull();
	});

	test('prints an ingredient row as the line was typed', () => {
		renderDiff([{ status: 'unchanged', ingredient: ingredient('flour', '2', 'cups') }]);
		expect(screen.getByText('2 cups flour')).toBeInTheDocument();
	});

	test('keeps line breaks inside a step row', () => {
		const { container } = renderDiff(
			[],
			[{ status: 'added', stepNumber: 1, step: { text: 'Mix.\nRest.' } }]
		);
		const content = container.querySelector('.diff-content');
		expect(content?.textContent?.trim()).toBe('Mix.\nRest.');
		expect(content).toHaveClass('whitespace-pre-line');
	});

	test('renders word-level segments inside a modified ingredient', () => {
		const { container } = renderDiff([
			{
				status: 'modified',
				ingredient: ingredient('sugar'),
				segments: [
					{ type: 'unchanged', text: '1 cup' },
					{ type: 'removed', text: 'white' },
					{ type: 'added', text: 'brown' },
					{ type: 'unchanged', text: 'sugar' }
				]
			} as unknown as IngredientDiffRow
		]);
		const row = container.querySelector('.diff-modified');
		expect(row?.textContent).toContain('~');
		// Both sides of the change are shown, not just the new value.
		expect(row?.querySelector('.diff-added')?.textContent?.trim()).toBe('brown');
		expect(row?.querySelector('.diff-removed')?.textContent?.trim()).toBe('white');
	});

	test('shows the step number on an added step', () => {
		const { container } = renderDiff(
			[],
			[{ status: 'added', stepNumber: 3, step: { text: 'Fold gently.' } } as StepDiffRow]
		);
		expect(container.querySelector('.step-num')?.textContent?.trim()).toBe('3');
		expect(screen.getByText('Fold gently.')).toBeInTheDocument();
	});

	test('omits the step number on a removed step', () => {
		// A removed step has no position in the new version, so numbering it
		// would imply the following steps had shifted.
		const { container } = renderDiff(
			[],
			[{ status: 'removed', step: { text: 'Chill overnight.' } } as StepDiffRow]
		);
		expect(container.querySelector('.step-num')).toBeNull();
		expect(screen.getByText('Chill overnight.')).toBeInTheDocument();
	});

	test('renders an added annotation under a modified step', () => {
		const { container } = renderDiff(
			[],
			[
				{
					status: 'modified',
					stepNumber: 2,
					segments: [{ type: 'unchanged', text: 'Bake.' }],
					annotation: {
						status: 'added',
						type: 'tip',
						segments: [{ type: 'added', text: 'watch it' }]
					}
				}
			]
		);
		const note = container.querySelector('.diff-annotation');
		expect(note).toHaveClass('diff-added');
		expect(note?.textContent).toContain('tip');
		expect(note?.textContent).toContain('watch it');
	});

	test('renders no annotation line on a modified step without one', () => {
		const { container } = renderDiff(
			[],
			[{ status: 'modified', stepNumber: 1, segments: [{ type: 'added', text: 'New.' }] }]
		);
		expect(container.querySelector('.diff-annotation')).toBeNull();
	});

	test('renders ingredient and step rows independently', () => {
		const { container } = renderDiff(
			[{ status: 'added', ingredient: ingredient('flour') } as IngredientDiffRow],
			[{ status: 'removed', step: { text: 'Preheat.' } } as StepDiffRow]
		);
		// One section has content, so only one "No changes" placeholder remains.
		expect(screen.queryAllByText('No changes')).toHaveLength(0);
		expect(container.querySelectorAll('.diff-added')).toHaveLength(1);
		expect(container.querySelectorAll('.diff-removed')).toHaveLength(1);
	});
});
