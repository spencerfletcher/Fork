import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProfilePage from './+page.svelte';

const data = {
	profile: { id: 'u1', username: 'chefmaria', avatarUrl: null, createdAt: new Date(2026, 9, 1) },
	recipes: [
		{
			id: 1,
			slug: 'a',
			title: 'Soup',
			description: null,
			imageUrl: null,
			parentId: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		},
		{
			id: 2,
			slug: 'b',
			title: 'Bread',
			description: null,
			imageUrl: null,
			parentId: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		}
	],
	commitCount: 5
} as never;

describe('Profile page', () => {
	test('sits on paper: name as the page title, counts in one mono line, no espresso block', () => {
		const { container } = render(ProfilePage, { props: { data } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('@chefmaria');
		expect(container.querySelector('.bg-hero-bg')).toBeNull();
		expect(
			container.querySelector('.profile-stats')?.textContent?.replace(/\s+/g, ' ').trim()
		).toBe('2 recipes · 5 commits');
	});

	test('lists the recipes under the same section heading and grid as browse', () => {
		const { container } = render(ProfilePage, { props: { data } });
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 recipes');
		expect(container.querySelector('.recipe-grid')).not.toBeNull();
	});
});
