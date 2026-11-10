import { describe, test, expect } from 'vitest';
import { cssRule, cssRules } from './css.js';

const source = `<style>
	.a {
		color: red;
	}

	/* A list across lines. */
	.b,
	.c:is(:hover, :focus-visible) {
		color: blue;
	}

	.x .c {
		color: green;
	}

	@media (max-width: 699px) {
		.a {
			color: pink;
		}
	}
</style>`;

describe('cssRule', () => {
	test('reads the first rule whose selector list holds the selector', () => {
		expect(cssRule(source, '.a')).toMatch(/color: red/);
		expect(cssRule(source, '.c:is(:hover, :focus-visible)')).toMatch(/color: blue/);
		expect(cssRule(source, '.b, .c:is(:hover, :focus-visible)')).toMatch(/color: blue/);
	});

	test('never matches a descendant selector ending in it', () => {
		expect(() => cssRule(source, '.c')).toThrow(/No rule for \.c/);
	});

	test('cssRules reads every one, nested too', () => {
		expect(cssRules(source, '.a')).toHaveLength(2);
		expect(cssRules(source, '.a')[1]).toMatch(/color: pink/);
	});
});
