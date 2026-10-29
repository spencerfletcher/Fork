import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TagPage from './+page.svelte';

const data = {
	tag: { id: 1, name: 'Dessert', slug: 'dessert' },
	tags: [{ id: 1, name: 'Dessert', slug: 'dessert' }],
	recipes: [] as unknown[],
	user: null as { id: string } | null
};

function renderTag(overrides: Partial<typeof data> = {}) {
	return render(TagPage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Tag page', () => {
	test('the empty state’s Explore all goes to the browse list, not the landing', () => {
		const { unmount } = renderTag();
		expect(screen.getByRole('link', { name: 'Explore all →' })).toHaveAttribute('href', '/recipes');
		unmount();
		renderTag({ user: { id: 'u1' } });
		expect(screen.getByRole('link', { name: 'Explore all →' })).toHaveAttribute('href', '/');
	});
});
