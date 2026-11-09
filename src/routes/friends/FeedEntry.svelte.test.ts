import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import FeedEntry from './FeedEntry.svelte';
import { BLOCK_SENTENCE } from '#lib/journal.js';

// enhance runs the submit callback the component hands it, so the optimistic
// flip and its rollback can be driven by the result passed in.
const { submits } = vi.hoisted(() => ({
	submits: [] as ((opts: { cancel: () => void }) => unknown)[]
}));
vi.mock('$app/forms', () => ({
	enhance: (_form: HTMLFormElement, submit?: (opts: { cancel: () => void }) => unknown) => {
		if (submit) submits.push(submit);
		return { destroy: () => {} };
	}
}));

type Item = ComponentProps<typeof FeedEntry>['item'];

function makeItem(overrides: Partial<Item> = {}): Item {
	return {
		kind: 'entry',
		at: new Date('2026-11-09T10:00:00Z'),
		entry: {
			id: 5,
			userId: 'dev',
			recipeId: 7,
			dish: 'Beet and Feta Salad',
			cookedOn: '2026-11-09',
			servings: 4,
			photoUrl: 'https://x/p8.jpg',
			caption: "Last of the farmers' market beets.",
			audience: 'friends',
			sourceUrl: null,
			createdAt: new Date('2026-11-09T10:00:00Z')
		},
		username: 'devcooks',
		source: {
			kind: 'recipe',
			slug: 'beet',
			title: 'Beet and Feta Salad with Orange',
			versionNumber: 2,
			visibility: 'public',
			own: false
		},
		likes: 2,
		liked: false,
		saved: false,
		...overrides
	};
}

beforeEach(() => {
	submits.length = 0;
});

describe('FeedEntry', () => {
	test('who, when, dish, photo, caption and source', () => {
		render(FeedEntry, { props: { item: makeItem() } });
		expect(screen.getByRole('link', { name: '@devcooks' })).toBeInTheDocument();
		expect(screen.getByText(/cooked Mon 9 Nov/)).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Beet and Feta Salad' })).toBeInTheDocument();
		expect(screen.getByRole('img')).toHaveAttribute(
			'alt',
			"@devcooks's photo of Beet and Feta Salad"
		);
		expect(screen.getByRole('link', { name: /Orange · v2/ })).toHaveAttribute(
			'href',
			'/recipes/beet?version=2'
		);
	});

	test('Like shows its count and flips at once, rolling back when the server refuses', async () => {
		render(FeedEntry, { props: { item: makeItem() } });
		const like = screen.getByRole('button', { name: /Like/ });
		expect(like).toHaveAttribute('aria-pressed', 'false');
		expect(like).toHaveTextContent('Like · 2');

		const after = submits[0]({ cancel: () => {} }) as (r: { result: { type: string } }) => void;
		await Promise.resolve();
		expect(like).toHaveAttribute('aria-pressed', 'true');
		expect(like).toHaveTextContent('Like · 3');

		await after({ result: { type: 'failure' } });
		expect(like).toHaveAttribute('aria-pressed', 'false');
		expect(like).toHaveTextContent('Like · 2');
		expect(screen.getByRole('alert')).toHaveTextContent('Could not like that.');
	});

	test("Save posts the recipe page's favorite toggle, and only for someone else's visible recipe", () => {
		const { unmount } = render(FeedEntry, { props: { item: makeItem({ saved: true }) } });
		const save = screen.getByRole('button', { name: 'Saved' });
		expect(save).toHaveAttribute('aria-pressed', 'true');
		expect(save.closest('form')).toHaveAttribute('action', '/recipes/beet?/toggleFavorite');
		unmount();

		render(FeedEntry, {
			props: { item: makeItem({ recipeId: null, source: { kind: 'hidden' } } as Partial<Item>) }
		});
		expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
		expect(
			screen.getByText(/cooked a private recipe. You can see the dish, not the recipe./)
		).toBeInTheDocument();
	});

	test('⋯ opens Mute, Unfriend, Report and Block; Block asks once more and says what it does', async () => {
		render(FeedEntry, { props: { item: makeItem() } });
		const more = screen.getByRole('button', { name: "More for @devcooks's Beet and Feta Salad" });
		await fireEvent.click(more);
		expect(more).toHaveAttribute('aria-expanded', 'true');
		for (const name of ['Mute @devcooks', 'Unfriend', 'Report', 'Block'])
			expect(screen.getByRole('button', { name })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Comment/ })).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: 'Block' }));
		expect(screen.getByText(BLOCK_SENTENCE)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Block @devcooks' }).closest('form')).toHaveAttribute(
			'action',
			'/friends?/block'
		);

		await fireEvent.keyDown(screen.getByRole('button', { name: 'Block @devcooks' }), {
			key: 'Escape'
		});
		expect(more).toHaveAttribute('aria-expanded', 'false');
		expect(more).toHaveFocus();
	});

	test("a friend's linked page shows as \"from\" its host, linking out without referrer or endorsement", () => {
		const url = 'https://seriouseats.com/dal';
		render(FeedEntry, {
			props: { item: makeItem({ source: { kind: 'link', url, host: 'seriouseats.com' } }) }
		});
		const link = screen.getByRole('link', { name: 'seriouseats.com' });
		expect(link).toHaveAttribute('href', url);
		expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc');
		expect(link.closest('p')).toHaveTextContent(/^from seriouseats\.com$/);
	});
});
