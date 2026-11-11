import { describe, test, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Layout from './+layout.svelte';
import { privatePage, recipeMeta, type PageMeta } from '#lib/seo.js';
import { makeContent } from '#lib/recipes/fixtures.js';

// What a crawler or link preview reads: the server-rendered head.
const state = vi.hoisted(() => ({
	page: {
		route: { id: '/recipes/[slug]' as string | null },
		error: null,
		url: new URL('https://fork.test/recipes/c'),
		data: {} as { meta?: PageMeta }
	}
}));
vi.mock('$app/state', () => state);
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }), applyAction: vi.fn() }));

const children = createRawSnippet(() => ({ render: () => '<p>The page</p>' }));

function headFor(meta: PageMeta) {
	state.page.data = { meta };
	return render(Layout, { props: { data: { user: null, profile: null }, children } as never }).head;
}

describe('layout head, server rendered', () => {
	test('Recipe data is one script whose recipe text cannot close it', () => {
		const title = '</script><img src=x onerror="alert(1)">';
		const head = headFor(
			recipeMeta({
				origin: 'https://fork.test',
				slug: 'c',
				isPublic: true,
				latest: true,
				author: 'chef',
				tags: [],
				parentSlug: null,
				published: new Date(),
				version: { ...makeContent({ title }), createdAt: new Date() }
			})
		);
		const script = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(head);
		expect(JSON.parse(script![1])).toMatchObject({ '@type': 'Recipe', name: title });
		expect(head).not.toContain('<img');
		expect(head.match(/<\/script>/g)).toHaveLength(1);
	});

	test('a private page sends its title and noindex, and no preview tags', () => {
		const head = headFor(privatePage('Secret stew'));
		expect(head).toContain('<meta name="robots" content="noindex"');
		expect(head).not.toMatch(/og:|twitter:|rel="canonical"|name="description"|ld\+json/);
	});
});
