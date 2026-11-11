import { describe, test, expect } from 'vitest';
import { DESTINATIONS, isCurrent } from './destinations';

const current = (path: string) =>
	DESTINATIONS.filter((d) => isCurrent(d, path)).map((d) => d.label);

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
