import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
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

function makeData(): PageData {
	const content = makeContent({
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
		expect(ingredients).toContainElement(screen.getByRole('button', { name: 'Double servings' }));
		const header = container.querySelector('header')!;
		expect(header.querySelector('input, .serves')).toBeNull();
		expect(header.querySelector('.details')).toHaveTextContent(`Serves ${STORED}`);
	});

	test('×2 doubles the box and the quantities; the unscalable line stays', async () => {
		load();
		await fireEvent.click(screen.getByRole('button', { name: 'Double servings' }));
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
