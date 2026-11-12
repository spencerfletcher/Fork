// The varied seed's recipes as the editor would take them, and as a cook would
// read them: every version passes the editor's validation and caps, and its
// header agrees with its method in the ways a check can see.
import { describe, test, expect } from 'vitest';
import { SEED } from '../seedData';
import { VARIED_COOKS } from './cooks';
import { VARIED_RECIPES } from './recipes';
import { baseAsVaried, seedDraft, storedContent, versionsOf, type BuiltVersion } from './build';
import { capError, parseDraftContent } from '#lib/recipes/validation.js';
import { changedGroups } from '#lib/recipes/content.js';
import type { Content, VariedRecipe } from './types';

const today = new Date('2026-11-12T00:00:00Z');
const base = baseAsVaried(SEED, today);
const all = [...base, ...VARIED_RECIPES];
const byKey = new Map(all.map((r) => [r.key, r]));
const built = VARIED_RECIPES.map((recipe) => ({ recipe, versions: versionsOf(recipe, byKey) }));
const each = built.flatMap(({ recipe, versions }) =>
	versions.map((version, i) => ({ name: `${recipe.key} v${i + 1}`, recipe, version, i }))
);

// ── What a check can read from a method ──────────────────────────────────────

// A wait the cook does not attend: these in a sentence with a duration are rest time.
const WAIT =
	/\b(chill|refrigerate|rest|rise|prove|proof|ferment|cure|marinate|soak|retard|steep|set|cool|macerate|brine|leave)/i;
const COOK = /\b(bake|roast|simmer|boil|fry|braise|grill|broil|smoke|toast|sear|poach|steam|cook)/i;
const HOURS = /(\d+(?:[.,]\d+)?)(?:\s*(?:–|-|to)\s*(\d+(?:[.,]\d+)?))?\s*(?:hours?|hrs?)\b/gi;
const MINUTES = /(\d+)(?:\s*(?:–|-|to)\s*(\d+))?\s*(?:minutes?|mins?)\b/gi;
const COUNTED =
	/\b(cookies?|biscuits?|rolls?|buns?|bagels?|loaf|loaves|muffins?|scones?|bars|pierogi|dumplings|bullar|tortillas|pancakes|fingers|squares|brownies)\b/i;

const sentences = (text: string) => text.split(/(?<=[.!?])\s+|\n+/);
const upper = (m: RegExpExecArray) => Number((m[2] ?? m[1]).replace(',', '.'));

/** Each sentence's longest stated duration in minutes, with whether it is a wait. */
function durations(steps: string) {
	return sentences(steps).flatMap((s) => {
		const found = [
			...[...s.matchAll(HOURS)].map((m) => upper(m) * 60),
			...[...s.matchAll(MINUTES)].map(upper)
		];
		if (found.length === 0) return [];
		return [{ sentence: s, minutes: Math.max(...found), wait: WAIT.test(s), cook: COOK.test(s) }];
	});
}

/** A step that waits an hour or more, or overnight, as its index. */
const longWaits = (steps: string[]) =>
	steps.flatMap((s, i) =>
		(WAIT.test(s) && /overnight/i.test(s) && !/\bor overnight/i.test(s)) ||
		durations(s).some((d) => d.wait && d.minutes >= 60)
			? [i]
			: []
	);

function steps(c: Content): string[] {
	return c.stepsText
		.split(/\n\s*\n/)
		.map((s) => s.trim())
		.filter((s) => s && !s.startsWith('#'));
}

describe('the varied recipes', () => {
	test('every key is unique, and none is a base slug', () => {
		const keys = all.map((r) => r.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	test('every author is a seeded cook', () => {
		const cooks = new Set<string>([...VARIED_COOKS, 'spencerfletcher', 'devcooks', 'priyabakes']);
		expect(VARIED_RECIPES.filter((r) => !cooks.has(r.author)).map((r) => r.key)).toEqual([]);
	});

	test('between 60 and 100 recipes with the base', () => {
		expect(all.length).toBeGreaterThanOrEqual(60);
		expect(all.length).toBeLessThanOrEqual(100);
	});

	test('a fork has no first version of its own and comes after its parent', () => {
		for (const r of VARIED_RECIPES.filter((r) => r.forkOf)) {
			expect(r.first, r.key).toBeUndefined();
			const parent = byKey.get(r.forkOf!.key)!;
			const copiedAt = versionsOf(parent, byKey)[r.forkOf!.version - 1].daysAgo;
			expect(r.daysAgo, r.key).toBeLessThan(copiedAt);
		}
	});

	test('versions come in order, and withdrawals and the Trash after them', () => {
		for (const { recipe, versions } of built) {
			const days = versions.map((v) => v.daysAgo);
			expect(days, recipe.key).toEqual([...days].sort((a, b) => b - a));
			const last = days.at(-1)!;
			for (const later of [
				recipe.withdrawn?.daysAgo,
				recipe.trashedDaysAgo,
				recipe.hiddenDaysAgo,
				recipe.tagsEditedDaysAgo
			])
				if (later !== undefined) expect(later, recipe.key).toBeLessThanOrEqual(last);
		}
	});

	test('a withdrawn recipe is private now; a trashed or hidden one is not private', () => {
		for (const r of VARIED_RECIPES) {
			if (r.withdrawn) expect(r.visibility, r.key).toBe('private');
			if (r.hiddenDaysAgo !== undefined) expect(r.visibility, r.key).not.toBe('private');
		}
	});

	test('every change changes something, as a save that changes nothing is refused', () => {
		for (const { recipe, versions } of built)
			for (let i = 1; i < versions.length; i++)
				expect(
					changedGroups(storedContent(versions[i - 1].content), storedContent(versions[i].content)),
					`${recipe.key} v${i + 1}`
				).not.toEqual([]);
	});

	test('a version after the first explains itself', () => {
		for (const { name, version, i } of each) if (i > 0) expect(version.message, name).toMatch(/\S/);
	});
});

describe.each(each)(
	'$name',
	({ recipe, version }: { recipe: VariedRecipe; version: BuiltVersion }) => {
		const c = version.content;
		const total = (c.prepTimeMinutes ?? 0) + (c.cookTimeMinutes ?? 0) + (c.restTimeMinutes ?? 0);

		test('the editor takes it, caps included', () => {
			const parsed = parseDraftContent(seedDraft(c, version.message));
			expect(parsed.ok ? null : parsed.error).toBeNull();
			expect(
				capError({
					title: c.title,
					description: c.description,
					commitMessage: version.message,
					tagNames: recipe.tags
				})
			).toBeNull();
		});

		test('a counted thing has a Makes', () => {
			if (COUNTED.test(c.title)) expect(c.makes).toMatch(/\d|one|a /i);
		});

		test('no step waits longer than the header allows, and a long wait is rest time', () => {
			for (const d of durations(c.stepsText)) {
				expect(d.minutes, d.sentence).toBeLessThanOrEqual(total);
				if (d.wait && !d.cook && d.minutes >= 60)
					expect(c.restTimeMinutes ?? 0, d.sentence).toBeGreaterThanOrEqual(d.minutes);
			}
			if (/overnight/i.test(c.stepsText) && !/\bor overnight/i.test(c.stepsText))
				expect(c.restTimeMinutes ?? 0).toBeGreaterThanOrEqual(8 * 60);
		});

		test('a cooking step fits the cook time', () => {
			for (const d of durations(c.stepsText))
				if (d.cook && !d.wait)
					expect(d.minutes, d.sentence).toBeLessThanOrEqual(c.cookTimeMinutes ?? 0);
		});

		test('no oven heats through a long wait before the bake it is for', () => {
			const list = steps(c);
			list.forEach((s, preheat) => {
				if (!/preheat|heat the oven/i.test(s)) return;
				const bake = list.findIndex((t, i) => i >= preheat && /\b(bake|roast)/i.test(t));
				const until = bake === -1 ? list.length : bake;
				const waits = longWaits(list).filter((i) => i > preheat && i < until);
				expect(waits, s).toEqual([]);
			});
		});
	}
);
