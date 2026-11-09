import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import JournalEntry from './JournalEntry.svelte';
import { PRIVATE_RECIPE_HINT } from '#lib/journal.js';

type Entry = ComponentProps<typeof JournalEntry>['entry'];

function makeEntry(overrides: Partial<Entry> = {}): Entry {
	return {
		id: 5,
		userId: 'me',
		recipeId: 7,
		versionId: 70,
		dish: 'Cardamom Cinnamon Buns',
		cookedOn: '2026-11-08',
		servings: 12,
		photoUrl: 'https://x/p3.jpg',
		caption: 'Birthday brunch for Sam.',
		note: 'Proof the shaped buns 15 minutes longer.',
		audience: 'friends',
		createdAt: new Date(),
		sourceUrl: null,
		source: {
			kind: 'recipe',
			slug: 'buns',
			title: 'Cardamom Cinnamon Buns with Brown Butter Glaze',
			versionNumber: 3,
			visibility: 'public',
			own: true
		},
		...overrides
	};
}

describe('JournalEntry', () => {
	test('day in the margin, source with its version, servings and audience in words', () => {
		const { container } = render(JournalEntry, { props: { entry: makeEntry() } });
		expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-11-08');
		expect(container.querySelector('.jday')).toHaveTextContent(/^8\s*Sun$/);
		expect(screen.getByRole('link', { name: /Brown Butter Glaze v3/ })).toHaveAttribute(
			'href',
			'/recipes/buns?version=3'
		);
		expect(screen.getByText('Served 12')).toBeInTheDocument();
		expect(screen.getByText('Friends')).toBeInTheDocument();
	});

	test("the note offers Change the recipe on one's own recipe, Fork on someone else's", () => {
		const own = render(JournalEntry, { props: { entry: makeEntry() } });
		expect(screen.getByRole('link', { name: 'Change the recipe →' })).toHaveAttribute(
			'href',
			'/recipes/buns/edit'
		);
		own.unmount();

		const entry = makeEntry();
		if (entry.source.kind !== 'recipe') throw new Error('fixture');
		render(JournalEntry, {
			props: { entry: { ...entry, source: { ...entry.source, own: false } } }
		});
		const fork = screen.getByRole('button', { name: 'Fork →' });
		expect(fork.closest('form')).toHaveAttribute('action', '/recipes/buns?/fork');
	});

	test('a deleted recipe says so in place of the link, and keeps dish, photo and note', () => {
		const { container } = render(JournalEntry, {
			props: { entry: makeEntry({ source: { kind: 'deleted' } }) }
		});
		expect(screen.getByText('Recipe deleted')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Glaze/ })).toBeNull();
		expect(screen.getByRole('heading', { name: 'Cardamom Cinnamon Buns' })).toBeInTheDocument();
		expect(container.querySelector('img')).toHaveAttribute('src', 'https://x/p3.jpg');
		expect(screen.getByText(/Proof the shaped buns/)).toBeInTheDocument();
	});

	test('improvised says so; a withheld recipe shows no source at all', () => {
		const improvised = render(JournalEntry, {
			props: { entry: makeEntry({ recipeId: null, source: { kind: 'improvised' } }) }
		});
		expect(screen.getByText('Improvised')).toBeInTheDocument();
		improvised.unmount();

		const { container } = render(JournalEntry, {
			props: { entry: makeEntry({ source: { kind: 'hidden' } }) }
		});
		expect(container.querySelector('.jsource')).toBeNull();
	});

	test('a Friends entry from an Only me recipe says what friends see', () => {
		const entry = makeEntry();
		if (entry.source.kind !== 'recipe') throw new Error('fixture');
		render(JournalEntry, {
			props: { entry: { ...entry, source: { ...entry.source, visibility: 'private' } } }
		});
		expect(screen.getByText(PRIVATE_RECIPE_HINT)).toBeInTheDocument();
		expect(screen.getByText('Only me recipe')).toBeInTheDocument();
	});

	test('a linked page shows as "from" its host, linking out', () => {
		const url = 'https://www.seriouseats.com/dal';
		render(JournalEntry, {
			props: {
				entry: makeEntry({
					recipeId: null,
					sourceUrl: url,
					source: { kind: 'link', url, host: 'seriouseats.com' }
				})
			}
		});
		const link = screen.getByRole('link', { name: 'seriouseats.com' });
		expect(link).toHaveAttribute('href', url);
		expect(link.closest('p')).toHaveTextContent(/^from seriouseats\.com$/);
		expect(screen.queryByText('Improvised')).toBeNull();
	});
});
