import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

const { page } = vi.hoisted(() => ({ page: { url: new URL('https://fork.test/friends') } }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const REQUEST = { id: 'p', username: 'priyabakes', sentAt: new Date('2026-11-07T12:00:00Z') };

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		user: { id: 'me' },
		profile: { id: 'me', username: 'spencerfletcher' },
		feed: [],
		requests: [],
		friendCount: 0,
		...overrides
	} as never;
}

describe('Friends page', () => {
	test('empty: a waiting request comes first, then No friends yet and Invite a friend', () => {
		const { container } = render(Page, { props: { data: makeData({ requests: [REQUEST] }) } });
		const request = screen.getByRole('button', { name: 'Accept @priyabakes' });
		const empty = screen.getByRole('heading', { name: 'No friends yet' });
		expect(request.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getByText('Sent Sat 7 Nov')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Invite a friend' })).toBeInTheDocument();
		expect(container.querySelector('.rail')).toBeNull();
	});

	test('with a feed: Newest first, the recipe event linking its diff, and the rail with the invite link', () => {
		const event = {
			kind: 'event',
			id: 1,
			versionNumber: 4,
			at: new Date('2026-11-09T10:00:00Z'),
			slug: 'buns',
			title: 'Cardamom buns',
			visibility: 'friends',
			username: 'maria'
		};
		render(Page, { props: { data: makeData({ feed: [event], friendCount: 1 }) } });
		expect(screen.getByText('Newest first')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'v3 → v4' })).toHaveAttribute(
			'href',
			'/recipes/buns/diff?from=3&to=4'
		);
		expect(screen.getByLabelText('Your invite link')).toHaveValue(
			'https://fork.test/users/spencerfletcher'
		);
		expect(screen.getByRole('complementary', { name: 'Requests and invite' })).toBeInTheDocument();
	});

	test('a first version reads as shared with friends', () => {
		const event = {
			kind: 'event',
			id: 2,
			versionNumber: 1,
			at: new Date('2026-11-08T10:00:00Z'),
			slug: 'shakshuka',
			title: 'Shakshuka',
			visibility: 'friends',
			username: 'devcooks'
		};
		const { container } = render(Page, { props: { data: makeData({ feed: [event], friendCount: 1 }) } });
		expect(container.querySelector('.event p')?.textContent?.replace(/\s+/g, ' ')).toContain(
			'@devcooks shared Shakshuka with friends'
		);
	});
});
