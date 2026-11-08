import { test, expect } from 'vitest';
import { localPath } from './localPath';

test('a path on this site, with its query, is kept', () => {
	expect(localPath('/recipes?x=1')).toBe('/recipes?x=1');
});

// Browsers read a backslash as a slash and drop tabs and newlines, so each of
// these leaves the site once it is a Location header.
test.each([
	'//evil.com',
	'/\\evil.com',
	decodeURIComponent('/%5Cevil.com'),
	'/\t/evil.com',
	'/\n/evil.com',
	'https://evil.com',
	'recipes',
	''
])('refuses %j', (value) => {
	expect(localPath(value)).toBeNull();
});

test('refuses nothing at all', () => {
	expect(localPath(null)).toBeNull();
});
