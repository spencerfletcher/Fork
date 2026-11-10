import { describe, test, expect } from 'vitest';
import source from './MoreMenu.svelte?raw';

// jsdom lays nothing out, so the offset is read from the source: the panel's
// top edge meets the ⋯ button's bottom edge, with no gap between them.
const rule = (selector: string) => source.match(new RegExp(`\\n\\t${selector} \\{([^}]*)\\}`))![1];
const px = (block: string, property: string) =>
	Number(block.match(new RegExp(`${property}: (-?\\d+)px`))![1]);

describe('MoreMenu', () => {
	test('the panel opens flush under the ⋯ button', () => {
		const button = rule('\\.more-button');
		const buttonTop = Number(button.match(/margin: (-?\d+)px/)![1]);
		expect(px(rule('\\.panel'), 'top')).toBe(buttonTop + px(button, 'height'));
	});
});
