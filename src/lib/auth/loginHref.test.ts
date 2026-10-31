import { describe, test, expect } from 'vitest';
import { loginHref } from './loginHref.js';

describe('loginHref', () => {
	test('carries the page to come back to, encoded', () => {
		expect(loginHref('/recipes/cookies?version=2')).toBe(
			'/login?redirectTo=%2Frecipes%2Fcookies%3Fversion%3D2'
		);
	});

	test('with nowhere to come back to it is the bare login page', () => {
		expect(loginHref(null)).toBe('/login');
	});

	test('the round trip hands login the exact path', () => {
		const path = '/recipes/crème brûlée/edit?a=1&b=2';
		const url = new URL(loginHref(path), 'http://x');
		expect(url.pathname).toBe('/login');
		expect(url.searchParams.get('redirectTo')).toBe(path);
	});
});
