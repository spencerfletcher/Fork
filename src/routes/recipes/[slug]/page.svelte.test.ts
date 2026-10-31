import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import pageSource from './+page.svelte?raw';
import type { PageData } from './$types';
import { makeContent, makeIngredient } from '#lib/recipes/fixtures.js';
import { FRACTIONS } from '#lib/recipes/scale.js';

// The page owns the serves: read from ?serves= on load, scaled into the
// ingredient list. The control's own behaviour is in ServesControl's tests.
const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: { url: new URL('http://localhost/recipes/cookies'), state: {} }
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
	const version = { id: 1, versionNumber: 1, commitMessage: 'Initial recipe', ...content };
	// Only the fields the page reads; the load's full row types are not needed here.
	return {
		recipe: { slug: 'cookies', title: 'Cookies', parentId: null, authorId: 'a', recipesToTags: [] },
		currentVersion: version,
		allVersions: [version],
		isViewingHistory: false,
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

beforeEach(() => goto.mockClear());

describe('recipe page scaling', () => {
	test('at the stored serves the box reads them and the lines are as typed', () => {
		load();
		expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue(String(STORED));
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
	});

	test('the control sits in the Ingredients section; the header says Serves N as text', () => {
		const { container } = load();
		const ingredients = container.querySelector('#ingredients')!;
		expect(ingredients).toContainElement(screen.getByRole('textbox', { name: 'Servings' }));
		const header = container.querySelector('header')!;
		expect(header.querySelector('input, .serves')).toBeNull();
		expect(header.querySelector('.details')).toHaveTextContent(`Serves ${STORED}`);
	});

	test('typing double the serves doubles the quantities; the unscalable line stays', async () => {
		load();
		await fireEvent.change(screen.getByRole('textbox', { name: 'Servings' }), {
			target: { value: String(STORED * 2) }
		});
		expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue(String(STORED * 2));
		expect(rows()[0]).toHaveTextContent('2 cups (250g) flour');
		expect(rows()[1]).toHaveTextContent('salt to taste');
		// The header stays truthful: it says the serves the list is scaled to.
		expect(document.querySelector('header .details')).toHaveTextContent(`Serves ${STORED * 2}`);
	});

	test('typing 6 shows 1.5x and scales', async () => {
		load();
		await fireEvent.change(screen.getByRole('textbox', { name: 'Servings' }), {
			target: { value: '6' }
		});
		expect(screen.getByText('1.5x')).toBeInTheDocument();
		expect(rows()[0]).toHaveTextContent(`1${FRACTIONS['1/2']} cups (188g) flour`);
	});

	test('Reset restores the stored serves and the typed lines', async () => {
		load('?serves=8');
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue(String(STORED));
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
		expect(new URL(goto.mock.lastCall![0]).searchParams.has('serves')).toBe(false);
	});

	test('?serves= on load applies', () => {
		load('?serves=2');
		expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue('2');
		expect(rows()[0]).toHaveTextContent(`${FRACTIONS['1/2']} cup (63g) flour`);
	});

	test('an invalid ?serves= is ignored', () => {
		load('?serves=lots');
		expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue(String(STORED));
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
		expect(header).toContainElement(screen.getByRole('link', { name: /Fork/ }));
	});

	test('the band is the --color-band cream, its photo a 4:3 inset of 504px', () => {
		// jsdom applies no CSS, so the geometry is read from source; the e2e
		// spec pins the band's computed colour.
		expect(pageSource).toMatch(/\.hero \{[^}]*background: var\(--color-band\);/);
		expect(pageSource).toMatch(/grid-template-columns: minmax\(0, 1fr\) 504px;/);
		expect(pageSource).toMatch(/aspect-ratio: 4 \/ 3;/);
	});

	test('in forced colours only the pressed section tab keeps its underline', () => {
		expect(pageSource).toMatch(
			/@media \(forced-colors: active\) \{\s*\.section-tabs button:not\(\[aria-pressed='true'\]\) \{\s*border-bottom-color: Canvas;/
		);
	});
});
