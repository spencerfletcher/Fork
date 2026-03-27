import { describe, test, expect } from 'vitest';
import { diffIngredients, diffSteps } from './diff';
import type { Ingredient, Step } from '$lib/server/db/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ing(name: string, amount = '1', unit = 'cup'): Ingredient {
	return { name, amount, unit };
}

function step(stepNum: number, text: string): Step {
	return { step: stepNum, text };
}

// ─── diffIngredients ──────────────────────────────────────────────────────────

describe('diffIngredients', () => {
	test('identical lists are all unchanged', () => {
		const list = [ing('flour'), ing('sugar'), ing('butter')];
		const result = diffIngredients(list, list);
		expect(result).toHaveLength(3);
		expect(result.every(r => r.status === 'unchanged')).toBe(true);
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

	test('changed amount emits removed (old) then added (new)', () => {
		const from = [ing('flour', '1', 'cup')];
		const to = [ing('flour', '2', 'cup')];
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ status: 'removed', ingredient: ing('flour', '1', 'cup') });
		expect(result[1]).toEqual({ status: 'added', ingredient: ing('flour', '2', 'cup') });
	});

	test('changed unit emits removed (old) then added (new)', () => {
		const from = [ing('milk', '1', 'cup')];
		const to = [ing('milk', '1', 'tbsp')];
		const result = diffIngredients(from, to);
		expect(result).toHaveLength(2);
		expect(result[0].status).toBe('removed');
		expect(result[1].status).toBe('added');
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
		const removed = result.filter(r => r.status === 'removed');
		const added = result.filter(r => r.status === 'added');
		expect(removed).toHaveLength(2);
		expect(added).toHaveLength(2);
	});

	test('preserves to-list order for unchanged and added rows', () => {
		const from = [ing('a'), ing('b')];
		const to = [ing('b'), ing('a'), ing('c')];
		const result = diffIngredients(from, to);
		const outputNames = result
			.filter(r => r.status !== 'removed')
			.map(r => r.ingredient.name);
		expect(outputNames).toEqual(['b', 'a', 'c']);
	});
});

// ─── diffSteps ────────────────────────────────────────────────────────────────

describe('diffSteps', () => {
	test('identical lists are all unchanged', () => {
		const list = [step(1, 'Mix'), step(2, 'Bake'), step(3, 'Cool')];
		const result = diffSteps(list, list);
		expect(result).toHaveLength(3);
		expect(result.every(r => r.status === 'unchanged')).toBe(true);
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

	test('changed text on same step number emits removed (old) then added (new)', () => {
		const from = [step(1, 'Bake at 350°F')];
		const to = [step(1, 'Bake at 375°F')];
		const result = diffSteps(from, to);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ status: 'removed', step: step(1, 'Bake at 350°F') });
		expect(result[1]).toEqual({ status: 'added', step: step(1, 'Bake at 375°F') });
	});

	test('results are sorted by step number', () => {
		const from = [step(1, 'A'), step(3, 'C')];
		const to = [step(1, 'A'), step(2, 'B'), step(3, 'C')];
		const result = diffSteps(from, to);
		const stepNums = result.map(r => r.step.step);
		expect(stepNums).toEqual([1, 2, 3]);
	});

	test('single step list each side', () => {
		const from = [step(1, 'old text')];
		const to = [step(1, 'new text')];
		const result = diffSteps(from, to);
		expect(result[0].status).toBe('removed');
		expect(result[1].status).toBe('added');
	});
});
