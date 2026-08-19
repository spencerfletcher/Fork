import { describe, test, expect } from 'vitest';
import { absoluteImage, clampDescription, pageTitle, DEFAULT_IMAGE, DEFAULT_META } from './seo';

describe('absoluteImage', () => {
	test('keeps an absolute URL', () => {
		expect(absoluteImage('https://images.example.com/a.jpg')).toBe(
			'https://images.example.com/a.jpg'
		);
	});

	test('falls back for the relative placeholder a recipe without a photo uses', () => {
		// '/None.png' is what RecipeCard renders; as an og:image it resolves
		// against the crawler's host, not ours, so it must not be emitted.
		expect(absoluteImage('/None.png')).toBe(DEFAULT_IMAGE);
	});

	test('falls back for null and empty', () => {
		expect(absoluteImage(null)).toBe(DEFAULT_IMAGE);
		expect(absoluteImage('')).toBe(DEFAULT_IMAGE);
	});
});

describe('clampDescription', () => {
	test('collapses whitespace', () => {
		expect(clampDescription('a  b\n\tc')).toBe('a b c');
	});

	test('leaves a short description alone', () => {
		expect(clampDescription('Short.')).toBe('Short.');
	});

	test('cuts at a word boundary, not mid-word', () => {
		const long = 'word '.repeat(60).trim();
		const out = clampDescription(long, 40);
		expect(out.length).toBeLessThanOrEqual(41);
		expect(out.endsWith('…')).toBe(true);
		expect(out).not.toMatch(/wo…$/);
	});
});

describe('pageTitle', () => {
	test('suffixes the site name', () => {
		expect(pageTitle('Chocolate Cake')).toBe('Chocolate Cake — Fork');
	});

	test('does not suffix the already-branded default', () => {
		expect(pageTitle(DEFAULT_META.title)).toBe(DEFAULT_META.title);
	});
});
