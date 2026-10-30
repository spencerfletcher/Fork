import { describe, test, expect } from 'vitest';
import source from './RecipeForm.svelte?raw';

// jsdom applies no component CSS, so the declarations are read from the source.
const style = source.slice(source.indexOf('<style>'));

describe('RecipeForm photo buttons', () => {
	test('reach 44px on a phone or under a coarse pointer', () => {
		const media = style.slice(style.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		const block = media.slice(0, media.indexOf('\n\t}\n'));
		expect(block).toMatch(/\.photo-choose,\s*\.photo-keep\s*{[^}]*min-height:\s*44px/);
	});
});

describe('RecipeForm actions on a phone', () => {
	// Every phone-only block, joined, so the test does not care which one holds a rule.
	const phone = style
		.split('@media (max-width: 699px) {')
		.slice(1)
		.map((rest) => rest.slice(0, rest.indexOf('\n\t}\n')))
		.join('\n');
	const rule = (selector: string) => {
		const at = phone.indexOf(`${selector} {`);
		return at < 0 ? '' : phone.slice(at, phone.indexOf('}', at));
	};

	test('Save and Cancel sit in a bar pinned to the bottom of the screen, clear of the home indicator', () => {
		const bar = rule('.form-actions');
		expect(bar).toMatch(/position:\s*sticky/);
		expect(bar).toMatch(/bottom:\s*0/);
		expect(bar).toMatch(/background:\s*var\(--color-surface\)/);
		expect(bar).toMatch(/border-top:\s*1px solid var\(--color-border\)/);
		expect(bar).toMatch(/padding(-bottom)?:[^;]*env\(safe-area-inset-bottom\)/);
	});

	test('a field focused near the bottom scrolls clear of the bar', () => {
		expect(rule(':global(html:has(.form-actions))')).toMatch(
			/scroll-padding-bottom:[^;]*env\(safe-area-inset-bottom\)/
		);
	});
});

describe('RecipeForm invalid fields', () => {
	// A fill made an empty invalid box look filled; the red border and the
	// message say it, and the placeholder keeps its own colour.
	test('an invalid box keeps the plain surface, not the error fill', () => {
		expect(style).toMatch(
			/\.form :global\(:is\(input, textarea\):is\(:user-invalid, \[aria-invalid='true'\]\)\)\s*{[^}]*background:\s*var\(--color-surface\)/
		);
	});

	test('the placeholder is not restyled on an invalid box', () => {
		expect(style).not.toMatch(/user-invalid[^{]*::placeholder/);
	});
});
