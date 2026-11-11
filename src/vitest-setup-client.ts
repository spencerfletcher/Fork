import '@testing-library/jest-dom/vitest';

// jsdom has no layout, and no Range.getBoundingClientRect at all; the live
// recipe text box measures where a heading's # ends with it.
Range.prototype.getBoundingClientRect ??= () => new DOMRect();

// Nor IntersectionObserver; the navbar watches itself with one. A test that
// drives it stubs its own.
globalThis.IntersectionObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
	readonly root = null;
	readonly rootMargin = '';
	readonly thresholds = [];
} as unknown as typeof IntersectionObserver;
