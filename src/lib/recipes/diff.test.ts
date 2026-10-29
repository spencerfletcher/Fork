import { describe, test, expect } from 'vitest';
import { diffIngredients, diffSteps, diffInline, diffMeta } from './diff';
import { makeIngredient, makeStep as step, makeContent } from './fixtures';
import type { Ingredient, StepAnnotation } from '#lib/recipes/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ing(name: string, amount = '1', unit = 'cup'): Ingredient {
	return makeIngredient(`${amount} ${unit} ${name}`);
}

// ─── diffInline ───────────────────────────────────────────────────────────────

describe('diffInline', () => {
	test('identical strings produce only unchanged segments', () => {
		const result = diffInline('1 cup flour', '1 cup flour');
		expect(result.every((s) => s.type === 'unchanged')).toBe(true);
	});

	test('1g paprika → 2g smoked paprika highlights only changed tokens', () => {
		const result = diffInline('1g paprika', '2g smoked paprika');
		expect(result.some((s) => s.type === 'removed' && s.text.includes('1g'))).toBe(true);
		expect(result.some((s) => s.type === 'added' && s.text.includes('2g'))).toBe(true);
		expect(result.some((s) => s.type === 'unchanged' && s.text.includes('paprika'))).toBe(true);
	});

	test('completely different strings produce removed and added segments only', () => {
		const result = diffInline('foo', 'bar');
		expect(result.some((s) => s.type === 'removed')).toBe(true);
		expect(result.some((s) => s.type === 'added')).toBe(true);
		expect(result.every((s) => s.type !== 'unchanged')).toBe(true);
	});
});

// ─── diffIngredients ──────────────────────────────────────────────────────────

describe('diffIngredients', () => {
	test('identical lists are all unchanged', () => {
		const list = [ing('flour'), ing('sugar'), ing('butter')];
		const result = diffIngredients(list, list);
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.status === 'unchanged')).toBe(true);
	});

	test('empty lists produce empty diff', () => {
		expect(diffIngredients([], [])).toHaveLength(0);
	});

	test('added ingredient appears as added', () => {
		const from = [ing('flour')];
		const to = [ing('flour'), ing('sugar')];
		const result = diffIngredients(from, to);
		expect(result).toContainEqual({ status: 'added', ingredient: ing('sugar') });
	});

	test('removed ingredient appears as removed', () => {
		const from = [ing('flour'), ing('sugar')];
		const to = [ing('flour')];
		const result = diffIngredients(from, to);
		expect(result).toContainEqual({ status: 'removed', ingredient: ing('sugar') });
	});

	test('changed quantity emits a single modified row with inline segments', () => {
		const from = [ing('flour', '1', 'cup')];
		const to = [ing('flour', '2', 'cup')];
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
		if (result[0].status === 'modified') {
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('1'))).toBe(
				true
			);
			expect(result[0].segments.some((s) => s.type === 'added' && s.text.includes('2'))).toBe(true);
		}
	});

	test('changed unit emits a single modified row with inline segments', () => {
		const from = [ing('milk', '1', 'cup')];
		const to = [ing('milk', '1', 'tbsp')];
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
		if (result[0].status === 'modified') {
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('cup'))).toBe(
				true
			);
			expect(result[0].segments.some((s) => s.type === 'added' && s.text.includes('tbsp'))).toBe(
				true
			);
		}
	});

	test('a changed range end is modified', () => {
		const from = [makeIngredient('2-3 cloves garlic')];
		const to = [makeIngredient('2-4 cloves garlic')];
		expect(diffIngredients(from, to)[0].status).toBe('modified');
	});

	test('a modified row diffs the lines as typed', () => {
		const from = [makeIngredient('1 cup flour')];
		const to = [makeIngredient('2 cups flour')];
		const [row] = diffIngredients(from, to);
		if (row.status !== 'modified') throw new Error('expected modified');
		const side = (skip: 'added' | 'removed') =>
			row.segments
				.filter((s) => s.type !== skip)
				.map((s) => s.text)
				.join('');
		expect(side('added')).toBe('1 cup flour');
		expect(side('removed')).toBe('2 cups flour');
	});

	test('name matching is case-insensitive', () => {
		const from = [ing('Flour')];
		const to = [ing('flour')];
		// Same ingredient, different case — should be unchanged (same amount/unit)
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('unchanged');
	});

	test('completely replaced list shows all removed then all added', () => {
		const from = [ing('flour'), ing('sugar')];
		const to = [ing('butter'), ing('eggs')];
		const result = diffIngredients(from, to);
		const removed = result.filter((r) => r.status === 'removed');
		const added = result.filter((r) => r.status === 'added');
		expect(removed).toHaveLength(2);
		expect(added).toHaveLength(2);
	});

	test('preserves to-list order for unchanged and added rows', () => {
		const from = [ing('a'), ing('b')];
		const to = [ing('b'), ing('a'), ing('c')];
		const result = diffIngredients(from, to);
		const outputNames = result
			.filter(
				(r): r is { status: 'unchanged' | 'added'; ingredient: Ingredient } =>
					r.status === 'unchanged' || r.status === 'added'
			)
			.map((r) => r.ingredient.name);
		expect(outputNames).toEqual(['b', 'a', 'c']);
	});

	test('a removed ingredient keeps its old position in the list', () => {
		const from = [ing('flour'), ing('sugar'), ing('butter')];
		const to = [ing('flour'), ing('butter')];
		const result = diffIngredients(from, to);
		expect(result.map((r) => r.status)).toEqual(['unchanged', 'removed', 'unchanged']);
	});

	test('an ingredient removed from the end is listed last', () => {
		const from = [ing('flour'), ing('salt')];
		const to = [ing('flour')];
		expect(diffIngredients(from, to).map((r) => r.status)).toEqual(['unchanged', 'removed']);
	});
});

// ─── diffSteps ────────────────────────────────────────────────────────────────

describe('diffSteps', () => {
	test('identical lists are all unchanged', () => {
		const list = [step('Mix'), step('Bake'), step('Cool')];
		const result = diffSteps(list, list);
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.status === 'unchanged')).toBe(true);
	});

	test('empty lists produce empty diff', () => {
		expect(diffSteps([], [])).toHaveLength(0);
	});

	test('added step appears as added', () => {
		const from = [step('Mix'), step('Bake')];
		const to = [step('Mix'), step('Bake'), step('Cool')];
		const result = diffSteps(from, to);
		expect(result).toContainEqual({ status: 'added', stepNumber: 3, step: step('Cool') });
	});

	test('removed step appears as removed', () => {
		const from = [step('Mix'), step('Bake'), step('Cool')];
		const to = [step('Mix'), step('Bake')];
		const result = diffSteps(from, to);
		expect(result).toContainEqual({ status: 'removed', step: step('Cool') });
	});

	test('changed text at the same position emits a single modified row', () => {
		const from = [step('Bake at 350°F')];
		const to = [step('Bake at 375°F')];
		const result = diffSteps(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
		if (result[0].status === 'modified') {
			expect(result[0].stepNumber).toBe(1);
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('350'))).toBe(
				true
			);
			expect(result[0].segments.some((s) => s.type === 'added' && s.text.includes('375'))).toBe(
				true
			);
		}
	});

	test('numbers rows by position, counting from 1', () => {
		const from = [step('A'), step('B')];
		const to = [step('A'), step('B'), step('C')];
		const result = diffSteps(from, to);
		const stepNums = result.map((r) => (r.status === 'removed' ? null : r.stepNumber));
		expect(stepNums).toEqual([1, 2, 3]);
	});

	test('an unchanged step carries its position', () => {
		const result = diffSteps([step('A')], [step('A')]);
		expect(result).toEqual([{ status: 'unchanged', stepNumber: 1, step: step('A') }]);
	});

	test('single step list each side emits modified', () => {
		const from = [step('old text')];
		const to = [step('new text')];
		const result = diffSteps(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
	});

	describe('annotations', () => {
		const tip = (text: string): StepAnnotation => ({ type: 'tip', text });
		const modified = (rows: ReturnType<typeof diffSteps>) => {
			const [row] = rows;
			if (row.status !== 'modified') throw new Error(`expected modified, got ${row.status}`);
			return row;
		};

		test('adding an annotation marks the step modified with unchanged text segments', () => {
			const row = modified(diffSteps([step('Bake.')], [step('Bake.', tip('watch it'))]));
			expect(row.stepNumber).toBe(1);
			expect(row.segments.every((s) => s.type === 'unchanged')).toBe(true);
			expect(row.annotation).toEqual({
				status: 'added',
				type: 'tip',
				segments: [{ type: 'added', text: 'watch it' }]
			});
		});

		test('removing an annotation is modified with a removed annotation diff', () => {
			const row = modified(diffSteps([step('Bake.', tip('watch it'))], [step('Bake.')]));
			expect(row.annotation).toEqual({
				status: 'removed',
				type: 'tip',
				segments: [{ type: 'removed', text: 'watch it' }]
			});
		});

		test('editing annotation text inline-diffs the annotation only', () => {
			const row = modified(
				diffSteps([step('Bake.', tip('watch it'))], [step('Bake.', tip('watch it closely'))])
			);
			expect(row.segments.every((s) => s.type === 'unchanged')).toBe(true);
			expect(row.annotation?.status).toBe('modified');
			expect(
				row.annotation?.segments.some((s) => s.type === 'added' && s.text.includes('closely'))
			).toBe(true);
		});

		test('changing only the annotation type is modified and reports the new type', () => {
			const row = modified(
				diffSteps([step('Bake.', tip('hot'))], [step('Bake.', { type: 'warning', text: 'hot' })])
			);
			expect(row.annotation).toMatchObject({ status: 'modified', type: 'warning' });
		});

		test('identical annotations stay unchanged', () => {
			const list = [step('Bake.', tip('hot'))];
			expect(diffSteps(list, list)[0].status).toBe('unchanged');
		});

		test('changed text and changed annotation both appear on one row', () => {
			const row = modified(diffSteps([step('Bake 10.', tip('a'))], [step('Bake 12.', tip('b'))]));
			expect(row.segments.some((s) => s.type === 'added' && s.text.includes('12'))).toBe(true);
			expect(row.annotation?.status).toBe('modified');
		});
	});
});

// ─── diffMeta ─────────────────────────────────────────────────────────────────

describe('diffMeta', () => {
	const base = makeContent();

	test('returns nothing for identical content', () => {
		expect(diffMeta(base, makeContent())).toEqual([]);
	});

	test('returns only the changed fields, in field order', () => {
		const to = makeContent({ servings: 8, title: 'Biscuits' });
		expect(diffMeta(base, to)).toEqual([
			{ field: 'title', from: 'Cookies', to: 'Biscuits' },
			{ field: 'servings', from: 4, to: 8 }
		]);
	});

	test('treats null and a value as a change, including zero', () => {
		const from = makeContent({ prepTimeMinutes: null });
		const to = makeContent({ prepTimeMinutes: 0 });
		expect(diffMeta(from, to)).toEqual([{ field: 'prepTimeMinutes', from: null, to: 0 }]);
	});

	test('ignores whitespace-only title and blank-vs-null description differences', () => {
		const to = makeContent({ title: ' Cookies ', description: '' });
		expect(diffMeta(base, to)).toEqual([]);
	});

	test('reports a changed photo by its urls', () => {
		const to = makeContent({ imageUrl: 'https://cdn/new.png' });
		expect(diffMeta(base, to)).toEqual([
			{ field: 'imageUrl', from: null, to: 'https://cdn/new.png' }
		]);
	});

	test('reports the normalised values, not the raw ones', () => {
		const to = makeContent({ title: ' Biscuits ' });
		expect(diffMeta(base, to)).toEqual([{ field: 'title', from: 'Cookies', to: 'Biscuits' }]);
	});
});
