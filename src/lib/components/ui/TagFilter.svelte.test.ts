import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TagFilter from './TagFilter.svelte';

const availableTags = [
	{ id: 1, name: 'Dessert', slug: 'dessert' },
	{ id: 2, name: 'Baking', slug: 'baking' }
];

const makeProps = (selectedTagSlugs: string[]) => ({
	availableTags,
	selectedTagSlugs,
	onTagToggle: vi.fn(),
	onClear: vi.fn()
});

describe('TagFilter', () => {
	// At the end, a first pick inserts nothing before the pills, so none moves.
	test('Clear all is the last button in the row when a tag is selected', () => {
		render(TagFilter, { props: makeProps(['dessert']) });
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(availableTags.length + 1);
		expect(buttons.at(-1)).toHaveTextContent('Clear all');
		expect(buttons.slice(0, -1).map((b) => b.textContent?.trim())).toEqual(
			availableTags.map((tag) => tag.name)
		);
	});

	test('no Clear all when nothing is selected', () => {
		render(TagFilter, { props: makeProps([]) });
		expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
	});
});
