import { describe, test, expect } from 'vitest';
import { forkedFromLine, originOf, withForkLine } from './forkedFrom.js';
import { makeVersion } from './fixtures.js';

describe('forkedFromLine', () => {
	test.each([
		[{ author: 'ana' }, 3, 'Forked from @ana, v3'],
		[{ author: null }, 3, 'Forked from v3'],
		['hidden' as const, 3, 'Forked from a private recipe, v3'],
		['deleted' as const, 3, 'Forked from a deleted recipe, v3'],
		[{ author: 'ana' }, null, 'Forked from @ana'],
		[{ author: null }, null, 'Forked']
	])('%o at v%s reads %s', (origin, version, line) => {
		expect(forkedFromLine(origin, version)).toBe(line);
	});
});

describe('originOf', () => {
	test('the parent the reader may open names its current author; deleted wins; else hidden', () => {
		expect(originOf({ parent: { author: { username: 'ana' } }, parentDeleted: false })).toEqual({
			author: 'ana'
		});
		expect(originOf({ parent: { author: null }, parentDeleted: false })).toEqual({
			author: null
		});
		expect(originOf({ parent: null, parentDeleted: true })).toBe('deleted');
		expect(originOf({ parent: null, parentDeleted: false })).toBe('hidden');
	});
});

describe('withForkLine', () => {
	const versions = [makeVersion(2, 'More salt'), makeVersion(1, '')];

	test("a fork's v1 reads its line from the parent; every other version keeps its message", () => {
		const fork = { parentId: 4, parentVersion: 3, parent: { author: { username: 'ana' } } };
		expect(withForkLine(versions, { ...fork, parentDeleted: false })).toEqual([
			makeVersion(2, 'More salt'),
			makeVersion(1, 'Forked from @ana, v3')
		]);
	});

	test('a recipe that is no fork keeps every message as stored', () => {
		const own = { parentId: null, parentVersion: null, parent: null, parentDeleted: false };
		expect(withForkLine(versions, own)).toEqual(versions);
	});
});
