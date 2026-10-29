import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import VersionDiff from './VersionDiff.svelte';
import source from './VersionDiff.svelte?raw';
import type { IngredientDiffRow, MetaDiffRow, StepDiffRow } from '#lib/recipes/diff.js';
import { makeIngredient, makeStep } from '#lib/recipes/fixtures.js';

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

	test('each panel is a list named by its heading, one item per row, so a reader hears the count', () => {
		const ingredients = [
			{ status: 'added', ingredient: ingredient('flour', '2') },
			{ status: 'unchanged', ingredient: ingredient('salt') },
			{ status: 'removed', ingredient: ingredient('butter') }
		] as IngredientDiffRow[];
		const steps = [
			{ status: 'unchanged', stepNumber: 1, step: makeStep('Mix.') },
			{ status: 'added', stepNumber: 2, step: makeStep('Rest.') }
		] as StepDiffRow[];
		const meta: MetaDiffRow[] = [{ field: 'title', from: 'Cookies', to: 'Biscuits' }];
		renderDiff(ingredients, steps, meta);
		for (const [name, rows] of [
			['Details', meta],
			['Ingredients', ingredients],
			['Method', steps]
		] as const) {
			const list = screen.getByRole('list', { name });
			expect(within(list).getAllByRole('listitem')).toHaveLength(rows.length);
		}
	});

	test('an empty panel is not a list: it says "No changes"', () => {
		renderDiff();
		expect(screen.queryAllByRole('list')).toHaveLength(0);
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
		expect(text(rowWith(container, 'sugar'))).toBe('Changed: ~ added: 2 cups sugar');
	});

	test('a lone insertion or deletion inside a changed row is named for a screen reader, as a replacement gets "to"', () => {
		const { container } = renderDiff([
			{
				status: 'modified',
				segments: [
					{ type: 'unchanged', text: '1 cup ' },
					{ type: 'added', text: 'brown ' },
					{ type: 'unchanged', text: 'sugar' }
				]
			},
			{
				status: 'modified',
				segments: [
					{ type: 'unchanged', text: '2 tsp vanilla' },
					{ type: 'removed', text: ', divided' }
				]
			},
			{
				status: 'modified',
				segments: [
					{ type: 'removed', text: '¾' },
					{ type: 'added', text: '½' },
					{ type: 'unchanged', text: ' cup flour' }
				]
			}
		]);
		expect(text(rowWith(container, 'brown'))).toBe('Changed: ~ 1 cup added: brown sugar');
		expect(text(rowWith(container, 'vanilla'))).toBe('Changed: ~ 2 tsp vanilla removed: , divided');
		// A replacement keeps its one "to" and gets neither word.
		expect(text(rowWith(container, 'flour'))).toBe('Changed: ~ ¾ to ½ cup flour');
	});

	test('the Details rows run the column, without the 72ch cap the list rows keep', () => {
		const { container } = renderDiff([], [], [{ field: 'title', from: 'A', to: 'B' }]);
		expect(rowWith(container, 'Title').querySelector('.diff-content')).toHaveClass(
			'diff-content--meta'
		);
	});

	test('Ingredients and Method share the version cards’ grid: two equal columns, 24px apart', () => {
		const { container } = renderDiff();
		const grid = container.querySelector('.diff-columns')!;
		expect(grid).toBeInTheDocument();
		expect(grid).toHaveClass('gap-x-5'); // --spacing-5 is 24px, the cards' gap
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
		expect(text(rowWith(container, 'Gradually'))).toBe('Changed: ~ 5. added: Gradually stir.');
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

// ─── Folding (the landing page's phone) ──────────────────────────────────────

describe('VersionDiff fold', () => {
	// Below 700px the landing's sample folds each run of unchanged rows into one
	// "N unchanged" row (Spencer: "in general folding unchanged rows would be
	// good"). The compare page keeps every row, so fold is off by default.
	const ingredients = [
		{ status: 'unchanged', ingredient: ingredient('flour') },
		{ status: 'unchanged', ingredient: ingredient('sugar') },
		{ status: 'unchanged', ingredient: ingredient('salt') },
		{ status: 'added', ingredient: ingredient('vanilla') },
		{ status: 'unchanged', ingredient: ingredient('butter') },
		{ status: 'removed', ingredient: ingredient('milk') }
	] as IngredientDiffRow[];
	const steps = [
		{ status: 'modified', stepNumber: 1, segments: [{ type: 'equal', text: 'Mix.' }] },
		{ status: 'unchanged', stepNumber: 2, step: makeStep('Rest.') },
		{ status: 'unchanged', stepNumber: 3, step: makeStep('Bake.') }
	] as StepDiffRow[];

	const panelRows = (container: HTMLElement, name: string) =>
		[...within(container).getByRole('list', { name }).children] as HTMLElement[];

	test('off by default: every row shows and nothing folds', () => {
		const { container } = renderDiff(ingredients, steps);
		expect(container.querySelector('.diff-fold')).toBeNull();
		expect(container.querySelector('.diff-folded')).toBeNull();
	});

	test('on: a run of two or more unchanged rows gets one "N unchanged" listitem after it', () => {
		const { container } = render(VersionDiff, {
			props: { metaDiff: [], ingredientDiff: ingredients, stepDiff: steps, fold: true }
		});
		const ing = panelRows(container, 'Ingredients');
		expect(ing.map((r) => text(r))).toEqual([
			expect.stringContaining('flour'),
			expect.stringContaining('sugar'),
			expect.stringContaining('salt'),
			'3 unchanged',
			expect.stringContaining('vanilla'),
			expect.stringContaining('butter'),
			expect.stringContaining('milk')
		]);
		expect(ing[3]).toHaveClass('diff-row', 'diff-fold');
		expect(ing[3]).toHaveAttribute('role', 'listitem');
		expect(ing.slice(0, 3).every((r) => r.classList.contains('diff-folded'))).toBe(true);
		// A lone unchanged row is not worth a fold row of its own height.
		expect(ing[5]).not.toHaveClass('diff-folded');

		// A run at the end: the fold row is the panel's last row.
		const method = panelRows(container, 'Method');
		expect(text(method.at(-1))).toBe('2 unchanged');
		expect(method.filter((r) => r.classList.contains('diff-folded'))).toHaveLength(2);
	});

	test('the fold shows only below 1024px, where the panels stack; wider, every row shows', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const style = source.slice(source.indexOf('<style>'));
		expect(style).toMatch(/\.diff-fold\s*{[^}]*display:\s*none/);
		const phone = style.slice(style.indexOf('@media (max-width: 1023px)'));
		expect(phone).toMatch(/\.diff-folded\s*{[^}]*display:\s*none/);
		expect(phone).toMatch(/\.diff-fold\s*{[^}]*display:\s*flex/);
	});
});
