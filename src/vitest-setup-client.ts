import '@testing-library/jest-dom/vitest';

// jsdom has no layout, and no Range.getBoundingClientRect at all; the live
// recipe text box measures where a heading's # ends with it.
Range.prototype.getBoundingClientRect ??= () => new DOMRect();
