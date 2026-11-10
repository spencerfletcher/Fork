import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '$app/forms';
import { BLOCK_SENTENCE } from '#lib/journal.js';
import ProfilePage from './+page.svelte';
import source from './+page.svelte?raw';

// Each form's enhance callback is kept by its action, so a test can play back a result.
const { submits } = vi.hoisted(() => ({ submits: new Map<string, SubmitFunction>() }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit?: SubmitFunction) => {
		if (submit) submits.set(form.getAttribute('action')!, submit);
		return { destroy: () => {} };
	}
}));

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
	relation: null as string | null
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

describe('Profile page dates', () => {
	test("the member date goes through the site's one formatDate", () => {
		expect(source).toContain('formatDate(');
		expect(source).not.toContain('toLocaleDateString');
	});
});

describe('Profile relationship control', () => {
	test.each([
		['none', 'button', 'Add friend', '/friends?/request'],
		['received', 'button', 'Accept request', '/friends?/accept']
	])('%s offers %s "%s", posting to %s', (relation, role, name, action) => {
		renderProfile({ relation });
		const control = screen.getByRole(role as 'button', { name });
		expect(control.closest('form')).toHaveAttribute('action', action);
	});

	test('a signed-out Add friend says the session ended, under the button', async () => {
		renderProfile({ relation: 'none' });
		const words = 'Your session ended. Log in in another tab, then try again.';
		const after = await (
			submits.get('/friends?/request') as unknown as () => Promise<
				(opts: { result: unknown; update: () => Promise<void> }) => Promise<void>
			>
		)();
		await after({
			result: { type: 'failure', status: 401, data: { error: words } },
			update: async () => {}
		});
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent(words);
	});

	test('a sent request says so', () => {
		renderProfile({ relation: 'sent' });
		expect(screen.getByText('Request sent')).toBeInTheDocument();
	});

	test('friends: a plain Friends ✓ button and a Block ghost beside it, no ⋯ menu', () => {
		renderProfile({ relation: 'friends' });
		expect(screen.getByRole('button', { name: 'Friends ✓' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('button', { name: 'Block' })).toHaveClass('btn-ghost');
		expect(screen.queryByRole('button', { name: /More for/ })).toBeNull();
		expect(source).not.toContain('MoreMenu');
	});

	test.each([
		['Friends ✓', 'Remove @chefmaria as a friend?', 'Remove', '/friends?/unfriend'],
		['Block', BLOCK_SENTENCE, 'Block', '/friends?/block']
	])('%s asks first: "%s", %s posts to %s', async (trigger, sentence, confirm, action) => {
		renderProfile({ relation: 'friends' });
		await fireEvent.click(screen.getByRole('button', { name: trigger }));
		await tick();
		expect(screen.getByText(sentence)).toBeInTheDocument();
		const submit = screen.getByRole('button', { name: confirm });
		expect(submit).toHaveAttribute('type', 'submit');
		expect(submit).toHaveClass('danger');
		const form = submit.closest('form')!;
		expect(form).toHaveAttribute('action', action);
		expect(form.querySelector('input[name="userId"]')).toHaveValue('u1');
		expect(screen.getByRole('group')).toHaveFocus();
	});

	test.each(['Friends ✓', 'Block'])(
		'from %s, Cancel and Escape close the confirm and return focus to it',
		async (trigger) => {
			renderProfile({ relation: 'friends' });
			await fireEvent.click(screen.getByRole('button', { name: trigger }));
			await tick();
			await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
			await tick();
			expect(screen.queryByRole('group')).toBeNull();
			expect(screen.getByRole('button', { name: trigger })).toHaveFocus();

			await fireEvent.click(screen.getByRole('button', { name: trigger }));
			await tick();
			await fireEvent.keyDown(screen.getByRole('group'), { key: 'Escape' });
			await tick();
			expect(screen.queryByRole('group')).toBeNull();
			expect(screen.getByRole('button', { name: trigger })).toHaveFocus();
		}
	);

	// relationFrom tells only the blocker 'blocked'; the blocked side reads 'none'.
	test('the blocker is offered Unblock, posting to /friends?/unblock with their id', () => {
		renderProfile({ relation: 'blocked' });
		const unblock = screen.getByRole('button', { name: 'Unblock' });
		const form = unblock.closest('form')!;
		expect(form).toHaveAttribute('action', '/friends?/unblock');
		expect(form.querySelector('input[name="userId"]')).toHaveValue('u1');
		expect(screen.queryByRole('button', { name: /friend|request/i })).toBeNull();
	});

	test.each([null, 'self'])('%s shows no control at all', (relation) => {
		renderProfile({ relation });
		expect(screen.queryByRole('button', { name: /friend|request/i })).toBeNull();
		expect(screen.queryByText(/Request sent|Friends ✓/)).toBeNull();
	});
});
