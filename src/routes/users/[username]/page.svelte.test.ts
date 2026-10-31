import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ProfilePage from './+page.svelte';
import source from './+page.svelte?raw';

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
	commitCount: 5,
	privateCount: 0
};

function renderProfile(overrides: Partial<typeof data> = {}) {
	return render(ProfilePage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Profile page', () => {
	test('sits on paper: name as the page title, the changes and the member date in one mono line', () => {
		// The recipe count appears once, on the section eyebrow; "Member since"
		// is a date, so it sits in the mono stats line, not a sans line of its
		// own (decided 29 October 2026). The dot between them is drawn by CSS.
		const { container } = renderProfile();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('@chefmaria');
		expect(container.querySelector('.bg-hero-bg')).toBeNull();
		const stats = container.querySelector('.profile-stats')!;
		expect(stats.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'5 changes Member since October 2026'
		);
		expect(stats.querySelector('.profile-since')).not.toBeNull();
		expect(screen.getAllByText(/2 recipes/)).toHaveLength(1);
	});

	test('one change is singular', () => {
		const { container } = renderProfile({ commitCount: 1 });
		expect(container.querySelector('.profile-stats .stat')).toHaveTextContent(/^1 change$/);
	});

	test('the owner sees one line under the stats for their private recipes; nobody else does', () => {
		const { unmount } = renderProfile({ privateCount: 3 });
		// It leads somewhere: My Recipes lists the private ones too.
		const line = screen.getByRole('link', { name: 'You also have 3 private recipes' });
		expect(line).toHaveAttribute('href', '/recipes');
		expect(line.closest('p')).toHaveClass('profile-private');
		unmount();
		const one = renderProfile({ privateCount: 1 });
		expect(screen.getByText('You also have 1 private recipe')).toBeInTheDocument();
		one.unmount();
		renderProfile();
		expect(screen.queryByText(/private recipe/)).toBeNull();
	});

	test('lists the recipes under the same section heading and grid as browse', () => {
		const { container } = renderProfile();
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 recipes');
		expect(container.querySelector('.recipe-grid')).not.toBeNull();
	});
});

describe('Profile page owner action', () => {
	const owner = { id: 'u1' };

	test('the owner gets one action, New recipe →, after the recipe list', () => {
		const { container } = render(ProfilePage, {
			props: { data: { ...data, user: owner } } as never
		});
		const link = screen.getByRole('link', { name: 'New recipe →' });
		expect(link).toHaveAttribute('href', '/recipes/new');
		expect(link).toHaveClass('arrow-link');
		const grid = container.querySelector('.recipe-grid')!;
		expect(grid.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test('the owner with no public recipes still gets it, under the empty line', () => {
		render(ProfilePage, {
			props: { data: { ...data, recipes: [], user: owner } } as never
		});
		expect(screen.getByRole('link', { name: 'New recipe →' })).toBeInTheDocument();
	});

	test('from 768 up, where the bar shows + New recipe, the line is hidden', () => {
		// jsdom applies no component CSS, so the rule is read from the source.
		const style = source.slice(source.indexOf('<style>'));
		expect(style).toMatch(
			/@media \(min-width: 768px\) \{\s*\.profile-new \{\s*display: none;\s*\}\s*\}/
		);
	});

	test('another signed-in viewer and a signed-out visitor do not see it', () => {
		const other = render(ProfilePage, {
			props: { data: { ...data, user: { id: 'u2' } } } as never
		});
		expect(screen.queryByRole('link', { name: /New recipe/ })).toBeNull();
		other.unmount();
		render(ProfilePage, { props: { data: { ...data, user: null } } as never });
		expect(screen.queryByRole('link', { name: /New recipe/ })).toBeNull();
	});
});

describe('Profile page forced colours', () => {
	test('the avatar circle has a transparent border, so it keeps its shape when the tint is stripped', () => {
		const style = source.slice(source.indexOf('<style>'));
		const avatar = style.match(/\.profile-avatar\s*{([^}]*)}/)![1];
		expect(avatar).toMatch(/border:\s*1px solid transparent/);
	});
});

describe('Profile page dates', () => {
	test("the member date goes through the site's one formatDate", () => {
		expect(source).toContain('formatDate(');
		expect(source).not.toContain('toLocaleDateString');
	});
});
