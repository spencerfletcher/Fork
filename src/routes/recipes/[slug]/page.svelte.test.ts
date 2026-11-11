import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import pageSource from './+page.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import type { PageData } from './$types';
import { makeContent, makeIngredient, makeVersion } from '#lib/recipes/fixtures.js';
import { FRACTIONS } from '#lib/recipes/scale.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { compactCount } from '#lib/helpers.js';

// The page owns the serves: read from ?serves= on load, scaled into the
// ingredient list. The control's own behaviour is in ServesControl's tests.
const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: {
		url: new URL('http://localhost/recipes/cookies'),
		state: {},
		shallow: null as { url: URL } | null
	}
}));
vi.mock('$app/navigation', () => ({ goto, afterNavigate: () => {} }));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const STORED = 4;

function makeData(imageUrl: string | null = null): PageData {
	const content = makeContent({
		imageUrl,
		servings: STORED,
		ingredients: [makeIngredient('1 cup flour'), makeIngredient('salt to taste')]
	});
	const version = { ...makeVersion(2, 'Chill the dough'), ...content };
	// Only the fields the page reads; the load's full row types are not needed here.
	return {
		recipe: { slug: 'cookies', title: 'Cookies', parentId: null, authorId: 'a', recipesToTags: [] },
		currentVersion: version,
		// Two versions, so the version bar renders.
		allVersions: [version, { ...makeVersion(1, 'Initial recipe'), ...content }],
		forkCount: 0,
		grams: [{ grams: 125, grams2: null, approximate: false }, null],
		isFavorited: false,
		user: null
	} as unknown as PageData;
}

const rows = () => screen.getAllByRole('checkbox').map((box) => box.closest('label')!);

function load(search = '') {
	page.url = new URL(`http://localhost/recipes/cookies${search}`);
	return render(Page, { props: { data: makeData() } });
}

beforeEach(() => {
	goto.mockClear();
	page.shallow = null;
});

describe('recipe page scaling', () => {
	test('at the stored serves the box reads them and the lines are as typed', () => {
		load();
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(STORED);
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});

	test('the control sits in the Ingredients section; the header says Serves N as text', () => {
		const { container } = load();
		const ingredients = container.querySelector('#ingredients')!;
		expect(ingredients).toContainElement(screen.getByRole('spinbutton', { name: 'Servings' }));
		const header = container.querySelector('header')!;
		expect(header.querySelector('input, .serves')).toBeNull();
		expect(header.querySelector('.details')).toHaveTextContent(`Serves ${STORED}`);
	});

	test('typing double the serves doubles the quantities; the unscalable line stays', async () => {
		load();
		await fireEvent.change(screen.getByRole('spinbutton', { name: 'Servings' }), {
			target: { value: String(STORED * 2) }
		});
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(STORED * 2);
		expect(rows()[0]).toHaveTextContent('2 cups (250g) flour');
		expect(rows()[1]).toHaveTextContent('salt to taste');
		// The header stays truthful: it says the serves the list is scaled to.
		expect(document.querySelector('header .details')).toHaveTextContent(`Serves ${STORED * 2}`);
	});

	test('typing 6 shows 1.5x and scales', async () => {
		load();
		await fireEvent.change(screen.getByRole('spinbutton', { name: 'Servings' }), {
			target: { value: '6' }
		});
		expect(screen.getByText('1.5x')).toBeInTheDocument();
		expect(rows()[0]).toHaveTextContent(`1${FRACTIONS['1/2']} cups (188g) flour`);
	});

	test('Reset restores the stored serves and the typed lines', async () => {
		load('?serves=8');
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(STORED);
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
		expect(new URL(goto.mock.lastCall![0]).searchParams.has('serves')).toBe(false);
	});

	test('?serves= on load applies', () => {
		load('?serves=2');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(2);
		expect(rows()[0]).toHaveTextContent(`${FRACTIONS['1/2']} cup (63g) flour`);
	});

	test('an invalid ?serves= is ignored', () => {
		load('?serves=lots');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(STORED);
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});
});

describe('recipe page title band', () => {
	test('the band holds the header, its actions and the photo after them', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		const { container } = render(Page, { props: { data: makeData('https://img/cookies.jpg') } });
		const band = container.querySelector('.hero')!;
		const header = band.querySelector('header.recipe-header')!;
		const photo = band.querySelector<HTMLElement>('.recipe-photo img')!;
		expect(photo).not.toBeNull();
		// Last in the band, so a stacked band reads words, buttons, then the photo.
		expect(header.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(band.querySelector('.hero-inner')!.lastElementChild).toContainElement(photo);
		expect(header).toContainElement(screen.getByRole('link', { name: 'Log in to save' }));
	});

	test('the band is the --color-band cream, its photo a 4:3 inset of 504px', () => {
		// jsdom applies no CSS, so the geometry is read from source; the e2e
		// spec pins the band's computed colour.
		expect(cssRule(pageSource, '.hero')).toMatch(/background: var\(--color-band\);/);
		expect(cssRule(pageSource, '.hero-inner')).toMatch(
			/grid-template-columns: minmax\(0, 1fr\) 504px;/
		);
		expect(cssRule(pageSource, '.recipe-photo img')).toMatch(/aspect-ratio: 4 \/ 3;/);
	});

	test('in forced colours only the pressed section tab keeps its underline', () => {
		const forced = pageSource.slice(pageSource.indexOf('@media (forced-colors: active)'));
		expect(cssRule(forced, ".section-tabs button:not([aria-pressed='true'])")).toMatch(
			/border-bottom-color: Canvas;/
		);
	});
});

describe('recipe page signed in', () => {
	test("a visitor's Save pill carries the recipe's save count", () => {
		page.url = new URL('http://localhost/recipes/cookies');
		const data = { ...makeData(), user: { id: 'visitor' }, favoriteCount: 1234 } as PageData;
		render(Page, { props: { data } });
		const save = screen.getByRole('button', { name: /^Save/ });
		expect(save.textContent).toContain(`· ${compactCount(1234)}`);
		expect(screen.getByRole('button', { name: 'Fork' })).toBeInTheDocument();
	});
});

describe('recipe page owner', () => {
	test('the owner gets Cook and Edit recipe only: no Save, no Fork', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		// makeData's recipe is authored by 'a'.
		const data = { ...makeData(), user: { id: 'a' }, favoriteCount: 1234 } as PageData;
		const { container } = render(Page, { props: { data } });
		const row = [...container.querySelectorAll('.actions a, .actions button')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(row).toEqual(['Cook', 'Edit recipe']);
	});
});

describe('recipe page logged out', () => {
	test('Log in to save leads to login and back to this page, query included', () => {
		load('?serves=8');
		expect(screen.getByRole('link', { name: 'Log in to save' })).toHaveAttribute(
			'href',
			loginHref('/recipes/cookies?serves=8')
		);
	});

	test('on an older version there is nothing to sign in for: no login link', () => {
		page.url = new URL('http://localhost/recipes/cookies?version=1');
		const data = makeData();
		render(Page, { props: { data: { ...data, currentVersion: data.allVersions[1] } } });
		expect(screen.queryByRole('link', { name: 'Log in to save' })).toBeNull();
		expect(screen.getByRole('link', { name: 'Back to v2' })).toBeInTheDocument();
	});
});

// The scaler and Cook write the URL with a shallow replace, which leaves
// page.url behind; a data reload (Favorite) or Back re-reads the page, so it
// must read the newest URL, page.shallow's.
describe('recipe page after a shallow replace', () => {
	function loadShallow(search: string) {
		page.url = new URL('http://localhost/recipes/cookies');
		page.shallow = { url: new URL(`http://localhost/recipes/cookies${search}`) };
		return render(Page, { props: { data: makeData() } });
	}

	test('the serves and Cook come from the shallow URL', () => {
		loadShallow('?serves=8&cook=1');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(8);
		expect(document.querySelector('article')).toHaveAttribute('data-cooking');
	});

	test('the login link comes back to the shallow URL', () => {
		loadShallow('?serves=8');
		expect(screen.getByRole('link', { name: 'Log in to save' })).toHaveAttribute(
			'href',
			loginHref('/recipes/cookies?serves=8')
		);
	});
});

describe('recipe page cooking mode', () => {
	const article = () => document.querySelector('article')!;
	const bar = () => document.querySelector('.bar-row');

	test('not cooking: no data-cooking, the bar and the actions show, Cook unpressed', () => {
		load();
		expect(article()).not.toHaveAttribute('data-cooking');
		expect(bar()).not.toBeNull();
		expect(screen.getByRole('link', { name: 'Log in to save' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cook' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('Cook marks the page, hides the bar and the actions, and writes ?cook=1', async () => {
		load();
		await fireEvent.click(screen.getByRole('button', { name: 'Cook' }));
		expect(article()).toHaveAttribute('data-cooking');
		expect(bar()).toBeNull();
		expect(screen.queryByRole('link', { name: 'Log in to save' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Done cooking' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(new URL(goto.mock.lastCall![0]).searchParams.get('cook')).toBe('1');
	});

	test('?cook=1 on load opens in cooking mode; Done restores the page and drops it', async () => {
		load('?cook=1');
		expect(article()).toHaveAttribute('data-cooking');
		expect(bar()).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Done cooking' }));
		expect(article()).not.toHaveAttribute('data-cooking');
		expect(bar()).not.toBeNull();
		expect(screen.getByRole('link', { name: 'Log in to save' })).toBeInTheDocument();
		expect(new URL(goto.mock.lastCall![0]).searchParams.has('cook')).toBe(false);
	});

	test('the header links its version count to the bar only while the bar is there', () => {
		const { unmount } = load();
		expect(screen.getByRole('link', { name: '2 versions' })).toHaveAttribute('href', '#versions');
		unmount();
		load('?cook=1');
		expect(screen.queryByRole('link', { name: '2 versions' })).toBeNull();
	});

	test('cooking, the article names the version being read; not cooking, it does not', () => {
		const { unmount } = load();
		expect(article()).not.toHaveAttribute('data-version');
		unmount();
		load('?cook=1');
		expect(article()).toHaveAttribute('data-version', '2');
	});

	test('Cook keeps the version and the serves in the URL', async () => {
		page.url = new URL('http://localhost/recipes/cookies?version=1&serves=8');
		const data = makeData();
		render(Page, { props: { data: { ...data, currentVersion: data.allVersions[1] } } });
		await fireEvent.click(screen.getByRole('button', { name: 'Cook' }));
		const url = new URL(goto.mock.lastCall![0]);
		expect(url.searchParams.get('version')).toBe('1');
		expect(url.searchParams.get('serves')).toBe('8');
		expect(url.searchParams.get('cook')).toBe('1');
		expect(article()).toHaveAttribute('data-version', '1');
	});

	test('a reload of that URL lands in Cook on the same version and scale', () => {
		page.url = new URL('http://localhost/recipes/cookies?version=1&serves=8&cook=1');
		const data = makeData();
		render(Page, { props: { data: { ...data, currentVersion: data.allVersions[1] } } });
		expect(article()).toHaveAttribute('data-cooking');
		expect(article()).toHaveAttribute('data-version', '1');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(8);
	});

	test('only ?cook=1 cooks', () => {
		load('?cook=yes');
		expect(article()).not.toHaveAttribute('data-cooking');
	});

	test('cooking keeps the ticks, the scaler and the section tabs', () => {
		load('?cook=1');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toBeInTheDocument();
		expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
		expect(screen.getByRole('navigation', { name: 'Recipe sections' })).toBeInTheDocument();
	});
});

describe('recipe page section tabs', () => {
	const pressed = (name: string) =>
		screen.getByRole('button', { name }).getAttribute('aria-pressed');

	test('a reload of the same recipe keeps Method; another recipe opens on Ingredients', async () => {
		const { rerender } = load();
		await fireEvent.click(screen.getByRole('button', { name: 'Method' }));
		expect(pressed('Method')).toBe('true');
		// A Favorite reloads the data: same recipe, new objects.
		await rerender({ data: makeData() });
		expect(pressed('Method')).toBe('true');
		// A parent or fork link keeps this page mounted with another recipe.
		const other = makeData();
		await rerender({ data: { ...other, recipe: { ...other.recipe, slug: 'other-cookies' } } });
		expect(pressed('Ingredients')).toBe('true');
	});
});
