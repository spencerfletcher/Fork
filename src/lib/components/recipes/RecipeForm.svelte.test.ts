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
