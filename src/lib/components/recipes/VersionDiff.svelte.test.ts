import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import VersionDiff from './VersionDiff.svelte';
import type { IngredientDiffRow, MetaDiffRow, StepDiffRow } from '#lib/recipes/diff.js';
import { makeIngredient } from '#lib/recipes/fixtures.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ingredient(name: string, amount = '1', unit = 'cup') {
	return makeIngredient(`${amount} ${unit} ${name}`);
}

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

/** The diff row whose text contains `needle`. */
function rowWith(container: HTMLElement, needle: string) {
	const row = [...container.querySelectorAll('.diff-row')].find((r) => text(r)?.includes(needle));
	if (!row) throw new Error(`no row with "${needle}"`);
	return row;
}

function renderDiff(
	ingredientDiff: IngredientDiffRow[] = [],
	stepDiff: StepDiffRow[] = [],
	metaDiff: MetaDiffRow[] = []
) {
	return render(VersionDiff, { props: { metaDiff, ingredientDiff, stepDiff } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VersionDiff', () => {
	test("renders an Ingredients and a Method section, in the recipe page's words", () => {
		renderDiff();
		expect(screen.getByText('Ingredients')).toBeInTheDocument();
		expect(screen.getByText('Method')).toBeInTheDocument();
		expect(screen.queryByText('Steps')).toBeNull();
	});

	test('says "No changes" in each empty section', () => {
		renderDiff();
		expect(screen.getAllByText('No changes')).toHaveLength(2);
	});

	test('renders no Details section when metaDiff is empty', () => {
		renderDiff();
		expect(screen.queryByText('Details')).not.toBeInTheDocument();
	});

	test('renders a Details section listing each changed field, old value then new', () => {
		const { container } = renderDiff(
			[],
			[],
			[
				{ field: 'title', from: 'Cookies', to: 'Biscuits' },
				{ field: 'servings', from: 4, to: 8 },
				{ field: 'cookTimeMinutes', from: 11, to: 13 }
			]
		);
		expect(screen.getByText('Details')).toBeInTheDocument();
		const title = rowWith(container, 'Title');
		expect(title.querySelector('del')).toHaveTextContent('Cookies');
		expect(title.querySelector('ins')).toHaveTextContent('Biscuits');
		expect(text(title)).toBe('Changed: ~ Title: Cookies to Biscuits');
		// The measure in the recipe page's words: value then label.
		expect(text(rowWith(container, 'servings'))).toBe('Changed: ~ 4 to 8 servings');
		expect(text(rowWith(container, 'cook'))).toBe('Changed: ~ 11 min to 13 min cook');
	});

	test('a time removed in Details reads — with no unit attached', () => {
		const { container } = renderDiff([], [], [{ field: 'prepTimeMinutes', from: 10, to: null }]);
		expect(text(rowWith(container, 'prep'))).toBe('Changed: ~ 10 min to — prep');
	});

	test('panel headings default to h3 and take the level a page gives them', () => {
		renderDiff();
		expect(screen.getByRole('heading', { level: 3, name: 'Ingredients' })).toBeInTheDocument();
	});

	test('prints 0 as a value and — for null', () => {
		const { container } = renderDiff([], [], [{ field: 'prepTimeMinutes', from: null, to: 0 }]);
		const row = rowWith(container, 'prep');
		expect(row.querySelector('.diff-removed')).toHaveTextContent('—');
		expect(row.querySelector('.diff-added')).toHaveTextContent('0 min');
	});

	test('renders a photo change as two thumbnails, or a dash where there was none', () => {
		renderDiff([], [], [{ field: 'imageUrl', from: null, to: 'https://cdn/new.png' }]);
		const row = screen.getByText(/^Photo/).closest('.diff-row')!;
		expect(row.querySelector('.diff-removed')).toHaveTextContent('—');
		expect(screen.getByRole('img', { name: 'After' })).toHaveAttribute(
			'src',
			'https://cdn/new.png'
		);
	});

	test('places the Details section before the Ingredients section', () => {
		renderDiff([], [], [{ field: 'title', from: 'A', to: 'B' }]);
		const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
		expect(headings).toEqual(['Details', 'Ingredients', 'Method']);
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

	test('a replaced word reads and copies as "old to new", with real elements for each side', () => {
		const { container } = renderDiff([
			{
				status: 'modified',
				segments: [
					{ type: 'removed', text: '¾' },
					{ type: 'added', text: '½' },
					{ type: 'unchanged', text: ' cup flour' }
				]
			}
		]);
		const content = container.querySelector('.diff-content')!;
		expect(text(content)).toBe('¾ to ½ cup flour');
		expect(content.querySelector('del.diff-removed')).toHaveTextContent('¾');
		expect(content.querySelector('ins.diff-added')).toHaveTextContent('½');
	});

	test('hides the gutter glyph from screen readers and prefixes each changed row for them', () => {
		const { container } = renderDiff(
			[
				{ status: 'added', ingredient: ingredient('flour') },
				{ status: 'removed', ingredient: ingredient('butter') },
				{ status: 'unchanged', ingredient: ingredient('salt') },
				{ status: 'modified', segments: [{ type: 'added', text: '2 cups sugar' }] }
			],
			[]
		);
		for (const gutter of container.querySelectorAll('.diff-gutter')) {
			expect(gutter).toHaveAttribute('aria-hidden', 'true');
		}
		expect(text(rowWith(container, 'flour'))).toBe('Added: + 1 cup flour');
		expect(text(rowWith(container, 'butter'))).toBe('Removed: − 1 cup butter');
		expect(text(rowWith(container, 'salt'))).toBe('1 cup salt');
		expect(text(rowWith(container, 'sugar'))).toBe('Changed: ~ 2 cups sugar');
	});

	test('shows the step number on an added step', () => {
		const { container } = renderDiff(
			[],
			[{ status: 'added', stepNumber: 3, step: { text: 'Fold gently.' } } as StepDiffRow]
		);
		expect(container.querySelector('.step-num')?.textContent?.trim()).toBe('3.');
		expect(screen.getByText('Fold gently.')).toBeInTheDocument();
	});

	test('a step number ends in an unseen stop, so a screen reader separates it from the text', () => {
		// Without it a modified step is announced as "Changed: 5 Gradually stir".
		const { container } = renderDiff(
			[],
			[
				{
					status: 'modified',
					stepNumber: 5,
					segments: [{ type: 'added', text: 'Gradually stir.' }]
				}
			]
		);
		expect(text(rowWith(container, 'Gradually'))).toBe('Changed: ~ 5. Gradually stir.');
		const stop = container.querySelector('.step-num .sr-only');
		expect(stop).toHaveTextContent('.');
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
