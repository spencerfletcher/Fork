import { describe, test, expect } from 'vitest';
import { DESTINATIONS, isCurrent, newActivityName } from './destinations';

const current = (path: string) =>
	DESTINATIONS.filter((d) => isCurrent(d, path)).map((d) => d.label);

describe('newActivityName', () => {
	const named = (path: string, unseen: boolean) =>
		DESTINATIONS.map((d) => newActivityName(d, path, unseen));

	test('Friends alone says it has something new, while the cook has anything unseen', () => {
		expect(named('/cookbook', true)).toEqual([
			undefined,
			undefined,
			undefined,
			'Friends, new activity'
		]);
		expect(named('/cookbook', false).every((n) => n === undefined)).toBe(true);
	});

	// The page being looked at is the one that clears it.
	test('not on Friends itself', () => {
		expect(named('/friends', true).every((n) => n === undefined)).toBe(true);
	});
});

describe('DESTINATIONS', () => {
	// Cookbook first (Spencer, 12 November 2026), the bar and the tab bar alike.
	test('bar order: Cookbook, Discover, Journal, Friends', () => {
		expect(DESTINATIONS.map((d) => d.label)).toEqual([
			'Cookbook',
			'Discover',
			'Journal',
			'Friends'
		]);
	});
});

describe('isCurrent', () => {
	test('each destination is current on its own path and below it', () => {
		for (const d of DESTINATIONS) {
			expect(current(d.href)).toEqual([d.label]);
			expect(current(`${d.href}/something`)).toEqual([d.label]);
		}
	});

	test('the signed-out home and tag pages are Discover', () => {
		expect(current('/')).toEqual(['Discover']);
		expect(current('/tags/baking')).toEqual(['Discover']);
	});

	test('a lookalike prefix is not current, nor is a recipe page', () => {
		expect(current('/cookbookish')).toEqual([]);
		expect(current('/recipes/dal')).toEqual([]);
	});
});
