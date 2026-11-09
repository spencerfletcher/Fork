import { describe, test, expect } from 'vitest';
import { load } from './+page.server';

const makeEvent = (search = '') =>
	({ url: new URL(`http://localhost/favorites${search}`) }) as unknown as Parameters<
		typeof load
	>[0];

// Favorites became the Cookbook's Saved filter.
describe('/favorites load', () => {
	test('moves permanently to the Cookbook, filtered to Saved', () => {
		expect(() => load(makeEvent())).toThrow(
			expect.objectContaining({ status: 301, location: '/cookbook?filter=saved' })
		);
	});

	test('carries a search and tags along', () => {
		expect(() => load(makeEvent('?q=soup&tags=dessert'))).toThrow(
			expect.objectContaining({
				status: 301,
				location: '/cookbook?q=soup&tags=dessert&filter=saved'
			})
		);
	});
});
