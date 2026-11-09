import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import EmptyPanel from './EmptyPanel.svelte';

const title = 'Nothing logged yet';
const sentence = 'Log what you cook.';
const children = createRawSnippet(() => ({ render: () => `<span>${sentence}</span>` }));
const action = createRawSnippet(() => ({ render: () => '<a href="/journal/new">Add</a>' }));

describe('EmptyPanel', () => {
	test('a heading, its sentence and the way out, in that order', () => {
		render(EmptyPanel, { props: { title, children, action } });
		const heading = screen.getByRole('heading', { level: 2, name: title });
		const panel = heading.parentElement!;
		expect(panel.children[1]).toHaveTextContent(sentence);
		expect(panel.lastElementChild).toContainElement(screen.getByRole('link', { name: 'Add' }));
		expect(panel).not.toHaveClass('centered');
	});

	test('centred on request; no action, no row', () => {
		render(EmptyPanel, { props: { title, children, centered: true } });
		const panel = screen.getByRole('heading', { name: title }).parentElement!;
		expect(panel).toHaveClass('centered');
		expect(panel.querySelector('.actions')).toBeNull();
	});
});
