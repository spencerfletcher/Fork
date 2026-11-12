import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Layout from './+layout.svelte';
import { DEFAULT_IMAGE, pageTitle, privatePage, recipeMeta, type PageMeta } from '#lib/seo.js';
import { makeContent } from '#lib/recipes/fixtures.js';

// The layout reads the route and any thrown error from page state.
const state = vi.hoisted(() => ({
	page: {
		route: { id: '/recipes/[slug]' as string | null },
		error: null as { message: string } | null,
		url: new URL('http://localhost/recipes/no-such-recipe'),
		data: {} as { meta?: PageMeta }
	}
}));
vi.mock('$app/state', () => state);
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }), applyAction: vi.fn() }));

const children = createRawSnippet(() => ({ render: () => '<p>The page</p>' }));

function renderLayout(
	routeId: string,
	error: { message: string } | null = null,
	meta?: PageMeta,
	url = 'http://localhost/recipes/no-such-recipe'
) {
	state.page.route.id = routeId;
	state.page.error = error;
	state.page.data = { meta };
	state.page.url = new URL(url);
	return render(Layout, { props: { data: { user: null, profile: null }, children } });
}

const head = (selector: string) => document.head.querySelector(selector);
const content = (selector: string) => head(selector)?.getAttribute('content');

/** A public recipe's latest version, through the recipe page's own helper. */
const publicRecipe = (title = 'Cookies', imageUrl: string | null = 'https://img.test/c.jpg') =>
	recipeMeta({
		origin: 'http://localhost',
		slug: 'cookies-ab12',
		isPublic: true,
		latest: true,
		author: 'chef',
		tags: [],
		parentSlug: null,
		published: new Date(),
		version: { ...makeContent({ title, description: 'Crisp.', imageUrl }), createdAt: new Date() }
	});

describe('layout head: a public page', () => {
	test('previews with absolute URLs from the request origin, canonical without the query', () => {
		renderLayout(
			'/recipes/[slug]',
			null,
			publicRecipe(),
			'https://fork.test/recipes/c?serves=8&cook=1'
		);
		expect(head('link[rel="canonical"]')).toHaveAttribute('href', 'https://fork.test/recipes/c');
		expect(content('meta[property="og:url"]')).toBe('https://fork.test/recipes/c');
		expect(content('meta[property="og:title"]')).toBe('Cookies');
		expect(content('meta[property="og:site_name"]')).toBe('Fork');
		expect(content('meta[property="og:image"]')).toBe('https://img.test/c.jpg');
		expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
		expect(head('meta[name="robots"]')).toBeNull();
	});

	test('a recipe without a photo shows the site card as a small card', () => {
		renderLayout(
			'/recipes/[slug]',
			null,
			publicRecipe('Cookies', null),
			'https://fork.test/recipes/c'
		);
		expect(content('meta[property="og:image"]')).toBe(`https://fork.test${DEFAULT_IMAGE}`);
		expect(content('meta[name="twitter:card"]')).toBe('summary');
	});

	test('a site page keeps the large site card, resolved against the origin', () => {
		renderLayout('/discover', null, { title: 'Discover' }, 'https://fork.test/discover?tags=a');
		expect(content('meta[property="og:image"]')).toBe(`https://fork.test${DEFAULT_IMAGE}`);
		expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
		expect(head('link[rel="canonical"]')).toHaveAttribute('href', 'https://fork.test/discover');
	});

	test('Recipe data is one parseable script, and recipe text cannot break out of it', () => {
		const title = '</script><img src=x onerror="window.pwned=1">';
		renderLayout('/recipes/[slug]', null, publicRecipe(title));
		const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts).toHaveLength(1);
		expect(JSON.parse(scripts[0].textContent!)).toMatchObject({ '@type': 'Recipe', name: title });
		expect(document.head.querySelector('img')).toBeNull();
	});
});

describe('layout head: a page not for everyone', () => {
	test('a private page has its title and noindex, and nothing else of its own', () => {
		renderLayout('/recipes/[slug]', null, privatePage('Secret stew'));
		expect(document.title).toBe(pageTitle('Secret stew'));
		expect(content('meta[name="robots"]')).toBe('noindex');
		for (const selector of [
			'meta[name="description"]',
			'link[rel="canonical"]',
			'meta[property^="og:"]',
			'meta[name^="twitter:"]',
			'script[type="application/ld+json"]'
		])
			expect(head(selector)).toBeNull();
		// The tab title is the one place the name appears.
		expect(document.head.innerHTML.split('Secret stew')).toHaveLength(2);
	});

	test('an error page is noindex and previews nothing', () => {
		renderLayout('/recipes/[slug]', { message: 'Recipe not found' });
		expect(content('meta[name="robots"]')).toBe('noindex');
		expect(head('meta[property^="og:"]')).toBeNull();
	});
});

describe('layout skip link', () => {
	test('a recipe skips past its header to the ingredients', () => {
		renderLayout('/recipes/[slug]');
		expect(screen.getByRole('link', { name: 'Skip to ingredients' })).toHaveAttribute(
			'href',
			'#recipe'
		);
	});

	test('a recipe that failed to load has no #recipe: it skips to the content', () => {
		renderLayout('/recipes/[slug]', { message: 'Recipe not found' });
		expect(screen.queryByRole('link', { name: 'Skip to ingredients' })).toBeNull();
		expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
	});

	test('any other page skips to the content', () => {
		renderLayout('/recipes');
		expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
	});
});

describe('layout tab title', () => {
	test("SvelteKit's default 404 message titles the tab as the error page heads it: Page not found", () => {
		renderLayout('/nope', { message: 'Not Found' });
		expect(document.title).toBe(pageTitle('Page not found'));
	});

	test('any other thrown message titles the tab as it is', () => {
		renderLayout('/recipes/[slug]', { message: 'Recipe not found' });
		expect(document.title).toBe(pageTitle('Recipe not found'));
	});
});

describe('layout navigation', () => {
	test('the phone tab bar follows the main content, after the top bar', () => {
		renderLayout('/cookbook');
		const tabBar = screen.getByRole('navigation', { name: 'Main' });
		expect(document.getElementById('main')!.compareDocumentPosition(tabBar)).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	});
});

describe('layout footer', () => {
	test('every page links once to Report a problem, which needs no account', () => {
		renderLayout('/discover');
		const links = screen.getAllByRole('link', { name: 'Report a problem' });
		expect(links).toHaveLength(1);
		expect(links[0]).toHaveAttribute('href', '/report');
		// Quiet: Ink 3 words, not a clay sentence action.
		expect(links[0]).not.toHaveClass('inline-action');
	});

	// Cooking is the recipe alone, as the tab bar steps aside for it.
	test('Cook mode has no footer', () => {
		renderLayout('/recipes/[slug]', null, undefined, 'http://localhost/recipes/dal?cook=1');
		expect(screen.queryByRole('link', { name: 'Report a problem' })).toBeNull();
	});
});

describe('layout hydration mark', () => {
	test('once mounted, the document is marked hydrated for the e2e suite to wait on', () => {
		delete document.documentElement.dataset.hydrated;
		renderLayout('/cookbook');
		expect(document.documentElement).toHaveAttribute('data-hydrated');
	});
});
