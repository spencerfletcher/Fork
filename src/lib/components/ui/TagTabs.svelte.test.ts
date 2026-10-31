import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagTabs from './TagTabs.svelte';

const tags = [
	{ id: 1, name: 'Baking', slug: 'baking' },
	{ id: 2, name: 'Dessert', slug: 'dessert' }
];

describe('TagTabs', () => {
	test('links All to the browse page and each tag to its page', () => {
		render(TagTabs, { props: { tags, active: null } });
		expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/recipes');
		expect(screen.getByRole('link', { name: 'Dessert' })).toHaveAttribute('href', '/tags/dessert');
	});

	test('marks the active tab for assistive tech', () => {
		render(TagTabs, { props: { tags, active: 'dessert' } });
		expect(screen.getByRole('link', { name: 'Dessert' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
	});

	test('All is current when no tag is active', () => {
		render(TagTabs, { props: { tags, active: null } });
		expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
	});

	test('All can point elsewhere, for a signed-in user whose /recipes is their own list', () => {
		render(TagTabs, { props: { tags, active: 'dessert', allHref: '/' } });
		expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/');
	});
});

// Search and Favorites filter with the same row: toggles, several at once.
const makeToggleProps = (selected: string[]) => ({
	tags,
	selected,
	onToggle: vi.fn(),
	onClear: vi.fn()
});

describe('TagTabs as toggles', () => {
	test('a group of toggle buttons, not a nav of links, with no All tab', () => {
		render(TagTabs, { props: makeToggleProps([]) });
		expect(screen.queryByRole('navigation')).toBeNull();
		expect(screen.queryByRole('link')).toBeNull();
		const row = screen.getByRole('group', { name: 'Filter by tag' });
		expect(row).toHaveClass('tag-tabs');
		expect(screen.getAllByRole('button').map((b) => b.textContent?.trim())).toEqual(
			tags.map((tag) => tag.name)
		);
	});

	test('several tags can be pressed at once', () => {
		render(TagTabs, { props: makeToggleProps(['baking', 'dessert']) });
		for (const tag of tags) {
			expect(screen.getByRole('button', { name: tag.name })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		}
	});

	test('an unpressed tag says so', () => {
		render(TagTabs, { props: makeToggleProps(['dessert']) });
		expect(screen.getByRole('button', { name: 'Baking' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('a press hands its slug to onToggle', async () => {
		const props = makeToggleProps([]);
		render(TagTabs, { props });
		await fireEvent.click(screen.getByRole('button', { name: 'Dessert' }));
		expect(props.onToggle).toHaveBeenCalledWith('dessert');
	});

	// At the end, a first pick inserts nothing before the tabs, so none moves.
	test('Clear all ends the row once a tag is pressed, and calls onClear', async () => {
		const props = makeToggleProps(['dessert']);
		render(TagTabs, { props });
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(tags.length + 1);
		expect(buttons.at(-1)).toHaveTextContent('Clear all');
		await fireEvent.click(buttons.at(-1)!);
		expect(props.onClear).toHaveBeenCalledTimes(1);
	});

	test('no Clear all while nothing is pressed', () => {
		render(TagTabs, { props: makeToggleProps([]) });
		expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
	});

	test('no row at all when there is nothing to filter by', () => {
		render(TagTabs, { props: { ...makeToggleProps([]), tags: [] } });
		expect(screen.queryByRole('group')).toBeNull();
	});
});
