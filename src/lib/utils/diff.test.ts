import { describe, test, expect } from 'vitest';
import { diffIngredients, diffSteps, diffInline } from './diff';
import type { Ingredient, Step } from '$lib/server/db/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ing(name: string, amount = '1', unit = 'cup'): Ingredient {
	return { name, amount, unit };
}

function step(stepNum: number, text: string): Step {
	return { step: stepNum, text };
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

	test('changed amount emits a single modified row with inline segments', () => {
		const from = [ing('flour', '1', 'cup')];
		const to = [ing('flour', '2', 'cup')];
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
		if (result[0].status === 'modified') {
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('1'))).toBe(true);
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
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('cup'))).toBe(true);
			expect(result[0].segments.some((s) => s.type === 'added' && s.text.includes('tbsp'))).toBe(true);
		}
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
			.filter((r): r is { status: 'unchanged' | 'added'; ingredient: Ingredient } =>
				r.status === 'unchanged' || r.status === 'added'
			)
			.map((r) => r.ingredient.name);
		expect(outputNames).toEqual(['b', 'a', 'c']);
	});
});

// ─── diffSteps ────────────────────────────────────────────────────────────────

describe('diffSteps', () => {
	test('identical lists are all unchanged', () => {
		const list = [step(1, 'Mix'), step(2, 'Bake'), step(3, 'Cool')];
		const result = diffSteps(list, list);
		expect(result).toHaveLength(3);
		expect(result.every((r) => r.status === 'unchanged')).toBe(true);
	});

	test('empty lists produce empty diff', () => {
		expect(diffSteps([], [])).toHaveLength(0);
	});

	test('added step appears as added', () => {
		const from = [step(1, 'Mix'), step(2, 'Bake')];
		const to = [step(1, 'Mix'), step(2, 'Bake'), step(3, 'Cool')];
		const result = diffSteps(from, to);
		expect(result).toContainEqual({ status: 'added', step: step(3, 'Cool') });
	});

	test('removed step appears as removed', () => {
		const from = [step(1, 'Mix'), step(2, 'Bake'), step(3, 'Cool')];
		const to = [step(1, 'Mix'), step(2, 'Bake')];
		const result = diffSteps(from, to);
		expect(result).toContainEqual({ status: 'removed', step: step(3, 'Cool') });
	});

	test('changed text on same step number emits a single modified row', () => {
		const from = [step(1, 'Bake at 350°F')];
		const to = [step(1, 'Bake at 375°F')];
		const result = diffSteps(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
		if (result[0].status === 'modified') {
			expect(result[0].stepNumber).toBe(1);
			expect(result[0].segments.some((s) => s.type === 'removed' && s.text.includes('350'))).toBe(true);
			expect(result[0].segments.some((s) => s.type === 'added' && s.text.includes('375'))).toBe(true);
		}
	});

	test('results are sorted by step number', () => {
		const from = [step(1, 'A'), step(3, 'C')];
		const to = [step(1, 'A'), step(2, 'B'), step(3, 'C')];
		const result = diffSteps(from, to);
		const stepNums = result.map((r) => (r.status === 'modified' ? r.stepNumber : r.step.step));
		expect(stepNums).toEqual([1, 2, 3]);
	});

	test('single step list each side emits modified', () => {
		const from = [step(1, 'old text')];
		const to = [step(1, 'new text')];
		const result = diffSteps(from, to);
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe('modified');
	});
});
