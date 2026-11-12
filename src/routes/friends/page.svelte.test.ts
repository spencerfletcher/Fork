import { describe, test, expect, vi } from 'vitest';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from './+page.svelte';
import source from './+page.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

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
		notices: [],
		unseen: false,
		friendCount: 0,
		...overrides
	} as never;
}

describe('Friends page', () => {
	test("a refused Accept or Decline says why, under the page's title", () => {
		const words = SESSION_ENDED('try again');
		render(Page, {
			props: {
				data: makeData({ requests: [REQUEST] }),
				form: { error: words, code: 'unauthenticated' } as never
			}
		});
		expect(screen.getByRole('alert')).toHaveTextContent(words);
	});

	test('empty: a waiting request comes first, then No friends yet and Invite a friend', () => {
		const { container } = render(Page, { props: { data: makeData({ requests: [REQUEST] }) } });
		const request = screen.getByRole('button', { name: 'Accept @priyabakes' });
		const empty = screen.getByRole('heading', { name: 'No friends yet' });
		expect(request.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getByText('Sent Sat 7 Nov')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Invite a friend' })).toBeInTheDocument();
		expect(container.querySelector('.rail')).toBeNull();
	});

	test('with a feed: no order line under the h1, the recipe event linking its diff, and the rail with the invite link', () => {
		const event = {
			kind: 'event',
			id: 'event-1',
			versionNumber: 4,
			at: new Date('2026-11-09T10:00:00Z'),
			slug: 'buns',
			title: 'Cardamom buns',
			visibility: 'friends',
			username: 'maria'
		};
		render(Page, { props: { data: makeData({ feed: [event], friendCount: 1 }) } });
		// A feed reads newest first without being told.
		expect(screen.queryByText('Newest first')).toBeNull();
		expect(screen.getByRole('link', { name: 'v3 → v4' })).toHaveAttribute(
			'href',
			'/recipes/buns/diff?from=3&to=4'
		);
		// The comma hugs the title, with no space before it.
		expect(
			screen.getByRole('link', { name: 'v3 → v4' }).closest('p')?.textContent?.replace(/\s+/g, ' ')
		).toContain('changed Cardamom buns, v3 → v4');
		expect(screen.getByLabelText('Your invite link')).toHaveValue(
			'https://fork.test/users/spencerfletcher'
		);
		expect(screen.getByRole('complementary', { name: 'Invite' })).toBeInTheDocument();
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
		const { container } = render(Page, {
			props: { data: makeData({ feed: [event], friendCount: 1 }) }
		});
		expect(container.querySelector('.event p')?.textContent?.replace(/\s+/g, ' ')).toContain(
			'@devcooks shared Shakshuka with friends'
		);
	});

	// A feed longer than a page ends in the shared Show more, to every page up to the next.
	test('a long feed ends in Show more; the last page has none', () => {
		const event = {
			kind: 'event',
			id: 'event-1',
			versionNumber: 1,
			at: new Date('2026-11-09T10:00:00Z'),
			slug: 'buns',
			title: 'Cardamom buns',
			visibility: 'friends',
			username: 'maria'
		};
		const { unmount } = render(Page, {
			props: { data: makeData({ feed: [event], friendCount: 1, next: 'c' }) }
		});
		expect(screen.getByRole('link', { name: 'Show more' })).toHaveAttribute(
			'href',
			'/friends?page=2'
		);
		unmount();
		render(Page, { props: { data: makeData({ feed: [event], friendCount: 1, next: null }) } });
		expect(screen.queryByRole('link', { name: 'Show more' })).toBeNull();
	});
});

describe('For you', () => {
	const AT = new Date('2026-11-10T09:00:00Z');
	const EVENT = {
		kind: 'event',
		id: 'event-1',
		versionNumber: 1,
		at: AT,
		slug: 'buns',
		title: 'Cardamom buns',
		visibility: 'friends',
		username: 'maria'
	};
	const notice = (n: Record<string, unknown>) => ({ at: AT, unseen: true, others: 0, ...n });
	const forYou = () => screen.queryByRole('region', { name: 'For you' });
	const line = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim();

	test('nothing waiting and nothing new: no band at all', () => {
		render(Page, { props: { data: makeData({ feed: [EVENT], friendCount: 1 }) } });
		expect(forYou()).toBeNull();
		expect(screen.queryByRole('heading', { name: 'Requests' })).toBeNull();
	});

	test('requests come first with Accept and Decline, then what is new; the rail keeps only the invite', () => {
		const notices = [
			notice({ id: 'accepted-a', kind: 'accepted', username: 'devcooks' }),
			notice({
				id: 'save-1',
				kind: 'save',
				username: 'ana',
				others: 2,
				recipe: { slug: 'shakshuka-x1', title: 'Shakshuka' }
			})
		];
		render(Page, {
			props: { data: makeData({ feed: [EVENT], friendCount: 1, requests: [REQUEST], notices }) }
		});
		const band = forYou()!;
		const rows = [...band.querySelectorAll('.event p')].map(line);
		expect(rows).toEqual([
			'@priyabakes wants to be friends Sent Sat 7 Nov',
			'@devcooks accepted your request Tue 10 Nov',
			'@ana and 2 others saved Shakshuka Tue 10 Nov'
		]);
		expect(within(band).getByRole('button', { name: 'Accept @priyabakes' })).toBeInTheDocument();
		expect(within(band).getByRole('button', { name: 'Decline @priyabakes' })).toBeInTheDocument();
		expect(within(band).getByRole('link', { name: 'Shakshuka' })).toHaveAttribute(
			'href',
			'/recipes/shakshuka-x1'
		);
		const rail = screen.getByRole('complementary', { name: 'Invite' });
		expect(within(rail).queryByRole('button', { name: /Accept/ })).toBeNull();
	});

	test('a like links the entry in the Journal; a fork names the fork the cook may open', () => {
		const notices = [
			notice({ id: 'like-4-a', kind: 'like', username: 'ana', entry: { id: 4, dish: 'Dal' } }),
			notice({
				id: 'fork-9',
				kind: 'fork',
				username: 'bo',
				recipe: { slug: 'dal', title: 'Dal' },
				fork: { slug: 'dal-spinach', title: 'Dal with spinach' }
			}),
			notice({
				id: 'fork-8',
				kind: 'fork',
				username: 'cy',
				recipe: { slug: 'buns', title: 'Buns' },
				fork: null
			})
		];
		render(Page, { props: { data: makeData({ notices }) } });
		const band = forYou()!;
		expect([...band.querySelectorAll('.event p')].map(line)).toEqual([
			'@ana liked your entry Dal Tue 10 Nov',
			'@bo forked Dal as Dal with spinach Tue 10 Nov',
			'@cy forked Buns Tue 10 Nov'
		]);
		expect(within(band).getAllByRole('link', { name: 'Dal' })[0]).toHaveAttribute(
			'href',
			'/journal#entry-4'
		);
		expect(within(band).getByRole('link', { name: 'Dal with spinach' })).toHaveAttribute(
			'href',
			'/recipes/dal-spinach'
		);
	});

	test('an actor whose account is gone reads without a handle', () => {
		const notices = [
			notice({
				id: 'fork-9',
				kind: 'fork',
				username: null,
				recipe: { slug: 'dal', title: 'Dal' },
				fork: null
			})
		];
		render(Page, { props: { data: makeData({ notices }) } });
		expect(line(forYou()!.querySelector('.event p')!)).toBe('A cook forked Dal Tue 10 Nov');
	});

	test('empty feed: the band leads, before No friends yet', () => {
		render(Page, { props: { data: makeData({ requests: [REQUEST] }) } });
		const empty = screen.getByRole('heading', { name: 'No friends yet' });
		expect(
			forYou()!.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	// The loader never stamps (a hover preloads it); the mounted page does, so
	// the band shows this visit's new things and the dot is out on the next page.
	test('once mounted, marks everything seen when something was unseen; not otherwise', async () => {
		const fetch = vi.fn().mockResolvedValue(new Response('{}'));
		vi.stubGlobal('fetch', fetch);
		const { unmount } = render(Page, { props: { data: makeData({ unseen: true }) } });
		await tick();
		expect(fetch).toHaveBeenCalledExactlyOnceWith('/notifications?/seen', {
			method: 'POST',
			body: expect.any(FormData),
			headers: { accept: 'application/json' }
		});
		unmount();
		fetch.mockClear();
		render(Page, { props: { data: makeData({ unseen: false }) } });
		await tick();
		expect(fetch).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	// Accept reloads the page's data, now with everything seen; the rows shown stay.
	test("this visit's new rows stay when the page's data reloads", async () => {
		const notices = [notice({ id: 'accepted-a', kind: 'accepted', username: 'devcooks' })];
		const { rerender } = render(Page, { props: { data: makeData({ notices }) } });
		await rerender({ data: makeData({ notices: [] }) });
		expect(within(forYou()!).getByText(/accepted your request/)).toBeInTheDocument();
	});

	// At 200% zoom a phone is 195px wide: Decline takes the next line rather
	// than running out of the band.
	test('Accept and Decline wrap rather than overflow a narrow screen', () => {
		expect(cssRule(source, '.btns')).toContain('flex-wrap: wrap');
	});
});
