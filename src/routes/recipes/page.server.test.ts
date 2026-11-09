import { describe, test, expect } from 'vitest';
import { load } from './+page.server';

const makeEvent = (search = '') =>
	({ url: new URL(`http://localhost/recipes${search}`) }) as unknown as Parameters<typeof load>[0];

// My Recipes and Favorites merged into the Cookbook.
describe('/recipes load', () => {
	test('moves permanently to the Cookbook', () => {
		expect(() => load(makeEvent())).toThrow(
			expect.objectContaining({ status: 301, location: '/cookbook' })
		);
	});
});
