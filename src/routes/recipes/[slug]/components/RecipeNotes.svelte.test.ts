import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RecipeNotes from './RecipeNotes.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';
import { TEXT_LIMITS } from '#lib/recipes/limits.js';

const renderNotes = (overrides: Parameters<typeof makeContent>[0] = {}) =>
	render(RecipeNotes, { props: { content: makeContent(overrides) } });

describe('RecipeNotes', () => {
	test('nothing to say, no section', () => {
		const { container } = renderNotes();
		expect(container.querySelector('section')).toBeNull();
	});

	test('the notes keep their line breaks under a Notes heading', () => {
		renderNotes({ notes: 'One.\n\nTwo.' });
		const section = screen.getByRole('region', { name: 'Notes' });
		const text = section.querySelector('.notes-text')!;
		expect(text.textContent).toBe('One.\n\nTwo.');
		expect(text).toHaveClass('whitespace-pre-line');
	});

	test('the labelled notes follow, each named by its label, in a fixed order', () => {
		renderNotes({ reheating: 'Low oven', makeAhead: 'Keeps 3 days', storage: 'Airtight' });
		const terms = [...document.querySelectorAll('dt')].map((dt) => dt.textContent!.trim());
		expect(terms).toEqual([
			TEXT_LIMITS.makeAhead.label,
			TEXT_LIMITS.storage.label,
			TEXT_LIMITS.reheating.label
		]);
		expect(screen.getByText('Keeps 3 days').tagName).toBe('DD');
		// Labelled notes alone still head the section.
		expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
	});
});
