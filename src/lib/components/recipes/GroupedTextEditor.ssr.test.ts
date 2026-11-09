import { describe, test, expect } from 'vitest';
import { render } from 'svelte/server';
import GroupedTextEditor from './GroupedTextEditor.svelte';

// Without JavaScript the plain textarea is the box, and it submits.
describe('GroupedTextEditor, server rendered', () => {
	test('is a labelled, required textarea holding the text, with no live box or Insert', () => {
		const { body } = render(GroupedTextEditor, {
			props: {
				id: 'steps',
				label: 'Method',
				value: '# Bake\nBake.',
				rows: 14,
				placeholder: 'Mix.',
				describedBy: 'steps-hint'
			}
		});
		expect(body).toMatch(/<label[^>]*for="steps"/);
		expect(body).toMatch(/<textarea[^>]*id="steps"[^>]*name="steps"[^>]*required/);
		expect(body).toContain('# Bake\nBake.</textarea>');
		expect(body).not.toContain('contenteditable');
		expect(body).not.toContain('Insert');
	});
});
