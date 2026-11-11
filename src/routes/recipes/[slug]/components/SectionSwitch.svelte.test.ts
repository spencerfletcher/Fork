import { describe, expect, test } from 'vitest';
import source from './SectionSwitch.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

// jsdom applies no component CSS, so the rules are read from source; the
// e2e spec pins the computed layout. The switch's behaviour is pinned through
// the recipe page (page.svelte.test.ts, "recipe page section tabs").
describe('SectionSwitch CSS', () => {
	test('in forced colours only the pressed section tab keeps its underline', () => {
		const forced = source.slice(source.indexOf('@media (forced-colors: active)'));
		expect(cssRule(forced, ".section-tabs button:not([aria-pressed='true'])")).toMatch(
			/border-bottom-color: Canvas;/
		);
	});

	test('below 1024 the cooking switch is pinned to the bottom, clear of the home indicator', () => {
		const narrow = source.slice(source.indexOf('@media (max-width: 1023px)'));
		const rule = cssRule(narrow, ':global([data-cooking]) .section-tabs');
		expect(rule).toMatch(/position: fixed;/);
		expect(rule).toMatch(/bottom: 0;/);
		expect(rule).toMatch(/env\(safe-area-inset-bottom\)/);
	});

	test('in forced colours only the current segment keeps its top line', () => {
		const forced = source.slice(source.lastIndexOf('@media (forced-colors: active)'));
		expect(
			cssRule(forced, ":global([data-cooking]) .section-tabs button:not([aria-pressed='true'])")
		).toMatch(/border-top-color: Canvas;/);
	});
});
