import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
});
