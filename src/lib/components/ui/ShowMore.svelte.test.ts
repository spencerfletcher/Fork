import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ShowMore from './ShowMore.svelte';

const { gotoMock, preloadMock, page } = vi.hoisted(() => ({
	gotoMock: vi.fn(),
	preloadMock: vi.fn(),
	page: {
		url: new URL('http://localhost/discover?q=soup'),
		shallow: null as { url: URL } | null,
		state: {}
	}
}));
vi.mock('$app/navigation', () => ({ goto: gotoMock, preloadData: preloadMock }));
vi.mock('$app/state', () => ({ page }));

/** A grid of `n` cards in the document, and a list that appends cards to it. */
function setup(next: string | null = 'c24', n = 2) {
	const grid = document.createElement('div');
	document.body.append(grid);
	const add = (count: number) => {
		for (let i = 0; i < count; i++) {
			const card = document.createElement('article');
			card.textContent = `Card ${grid.children.length + 1}`;
			grid.append(card);
		}
	};
	add(n);
	const list = {
		next,
		append: vi.fn((data: unknown) => {
			const { added } = data as { added: number };
			add(added);
			return added;
		})
	};
	render(ShowMore, { props: { list, container: grid, noun: 'recipe' } });
	return { grid, list };
}

const link = () => screen.getByRole('link', { name: /show more|loading/i });

beforeEach(() => {
	vi.clearAllMocks();
	document.body.innerHTML = '';
	page.url = new URL('http://localhost/discover?q=soup');
	page.shallow = null;
});

describe('ShowMore', () => {
	test('is a real link to every page up to the next, filters kept, for a page without JavaScript', () => {
		setup();
		expect(link()).toHaveTextContent('Show more');
		expect(link()).toHaveAttribute('href', '/discover?q=soup&page=2');
		expect(link()).toHaveClass('btn-ghost');
	});

	test('opts out of hover preload with a value SvelteKit accepts', () => {
		setup();
		expect(link()).toHaveAttribute('data-sveltekit-preload-data', 'false');
	});

	test('counts on from the pages already in the URL', () => {
		page.url = new URL('http://localhost/discover?q=soup&page=3');
		setup();
		expect(link()).toHaveAttribute('href', '/discover?q=soup&page=4');
	});

	test('at the end of the list there is nothing to show more of', () => {
		setup(null);
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('fetches the page after the cursor, appends it, says how many came, and focuses the first', async () => {
		preloadMock.mockResolvedValue({ type: 'loaded', status: 200, data: { added: 3 } });
		const { grid, list } = setup();

		await fireEvent.click(link());

		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 more recipes'));
		expect(preloadMock).toHaveBeenCalledWith('/discover?q=soup&after=c24');
		expect(list.append).toHaveBeenCalledWith({ added: 3 });
		expect(grid.children).toHaveLength(5);
		expect(document.activeElement).toBe(grid.children[2]);
		// Back and a reload ask for every page now shown, by the link's own URL.
		expect(gotoMock).toHaveBeenCalledWith('/discover?q=soup&page=2', {
			shallow: true,
			replace: true,
			state: page.state
		});
	});

	test('builds on a shallow URL a press before it wrote', async () => {
		page.shallow = { url: new URL('http://localhost/discover?q=soup&page=2') };
		preloadMock.mockResolvedValue({ type: 'loaded', status: 200, data: { added: 1 } });
		setup();
		expect(link()).toHaveAttribute('href', '/discover?q=soup&page=3');
		await fireEvent.click(link());
		await waitFor(() => expect(gotoMock).toHaveBeenCalled());
		expect(preloadMock).toHaveBeenCalledWith('/discover?q=soup&after=c24');
	});

	test('pending, it says so and a second press asks nothing more', async () => {
		let settle: (v: unknown) => void = () => {};
		preloadMock.mockReturnValue(new Promise((r) => (settle = r)));
		setup();

		await fireEvent.click(link());
		expect(link()).toHaveAttribute('aria-busy', 'true');
		expect(link()).toHaveTextContent('Loading…');
		await fireEvent.click(link());
		expect(preloadMock).toHaveBeenCalledTimes(1);

		settle({ type: 'loaded', status: 200, data: { added: 1 } });
		await waitFor(() => expect(link()).toHaveTextContent('Show more'));
		expect(link()).not.toHaveAttribute('aria-busy');
	});

	test.each([
		['a refusal', () => preloadMock.mockResolvedValue({ type: 'error', status: 500 })],
		['a network failure', () => preloadMock.mockRejectedValue(new TypeError('Failed to fetch'))]
	])('%s appends nothing and says so, and the link stays to try again', async (_, fail) => {
		fail();
		const { list } = setup();

		await fireEvent.click(link());

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Could not load more recipes. Try again.'
		);
		expect(list.append).not.toHaveBeenCalled();
		expect(gotoMock).not.toHaveBeenCalled();
		expect(link()).toHaveTextContent('Show more');
	});

	test('a press for a new tab is the browser’s', async () => {
		setup();
		await fireEvent.click(link(), { metaKey: true });
		expect(preloadMock).not.toHaveBeenCalled();
	});
});
