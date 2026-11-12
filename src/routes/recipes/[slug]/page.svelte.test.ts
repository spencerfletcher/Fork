import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import pageSource from './+page.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import type { PageData } from './$types';
import { makeContent, makeIngredient, makeStep, makeVersion } from '#lib/recipes/fixtures.js';
import { FRACTIONS } from '#lib/recipes/scale.js';
import { loginHref } from '#lib/auth/loginHref.js';
import { compactCount } from '#lib/helpers.js';
import { lastShallowUrl } from '#lib/testing/navigation.js';
import { tick } from 'svelte';
import { ticksKey, saveTicks } from './components/ticks';

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
		grams: [{ grams: 125, grams2: null, approximate: false, likeWater: false }, null],
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

describe('recipe page measurement', () => {
	const withProfile = (measurement: 'metric' | 'us' | null, history = false) => {
		const data = makeData();
		return {
			...data,
			user: { id: 'cook' },
			profile: { measurement },
			currentVersion: history ? data.allVersions[1] : data.currentVersion
		} as unknown as PageData;
	};

	test('a cook who chose metric reads the latest version converted', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		render(Page, { props: { data: withProfile('metric') } });
		// Flour is weighed: grams first, the cups in brackets.
		expect(rows()[0]).toHaveTextContent('125 g written as (1 cup) flour');
		expect(screen.getByText(/^Converted to metric/)).toBeInTheDocument();
	});

	test('a past version is a record: as written whatever the preference', () => {
		page.url = new URL('http://localhost/recipes/cookies?v=1');
		render(Page, { props: { data: withProfile('metric', true) } });
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
		expect(screen.queryByText(/^Converted to/)).toBeNull();
	});

	test('signed out, the list is as written', () => {
		load();
		expect(rows()[0]).toHaveTextContent('1 cup (125g) flour');
		expect(screen.queryByText(/^Converted to/)).toBeNull();
	});
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

	test('a Makes-only recipe gets the scaler: ?makes= doubles the batch, the header follows', () => {
		const data = makeData();
		const cookies = { ...data.currentVersion, servings: null, makes: '24 cookies' };
		page.url = new URL('http://localhost/recipes/cookies?makes=48');
		render(Page, { props: { data: { ...data, currentVersion: cookies } as PageData } });
		expect(screen.getByRole('spinbutton', { name: 'Makes' })).toHaveValue(48);
		expect(rows()[0]).toHaveTextContent('2 cups (250g) flour');
		expect(document.querySelector('header .details')).toHaveTextContent('Makes 48 cookies');
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
});

describe('recipe page signed in', () => {
	test("a visitor's Save pill carries the recipe's save count", () => {
		page.url = new URL('http://localhost/recipes/cookies');
		const data = { ...makeData(), user: { id: 'visitor' }, favoriteCount: 1234 } as PageData;
		render(Page, { props: { data } });
		const save = screen.getByRole('button', { name: /^Save/ });
		expect(save.textContent).toContain(compactCount(1234));
		expect(screen.getByRole('button', { name: 'Fork' })).toBeInTheDocument();
	});
});

describe('recipe page owner', () => {
	test('the owner gets Cook and Edit recipe only: no Save, no Fork', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		// makeData's recipe is authored by 'a'.
		const data = { ...makeData(), user: { id: 'a' }, favoriteCount: 1234 } as PageData;
		const { container } = render(Page, { props: { data } });
		// The pills; the ⋯ after them holds collections and Print.
		const row = [...container.querySelectorAll('.actions > a, .actions > button')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(row).toEqual(['Cook', 'Edit recipe']);
	});
});

// Restore brings an older version back as the newest: only the owner, only on
// an older version, and only when it differs from the latest.
describe('recipe page restore', () => {
	const RESTORE = { name: 'Restore this version' };

	function view(opts: { user: string | null; version: 1 | 2; sameContent?: boolean }) {
		page.url = new URL(`http://localhost/recipes/cookies?version=${opts.version}`);
		const data = makeData();
		const [latest, first] = data.allVersions;
		const older = opts.sameContent ? first : { ...first, title: 'Plain cookies' };
		const allVersions = [latest, older];
		render(Page, {
			props: {
				data: {
					...data,
					user: opts.user ? { id: opts.user } : null,
					allVersions,
					currentVersion: opts.version === 1 ? older : latest
				} as PageData
			}
		});
	}

	test('the owner reading an older version that differs gets Restore', () => {
		view({ user: 'a', version: 1 });
		expect(screen.getByRole('button', RESTORE)).toBeInTheDocument();
	});

	test('not on the latest version', () => {
		view({ user: 'a', version: 2 });
		expect(screen.queryByRole('button', RESTORE)).toBeNull();
	});

	test('not for anyone but the owner, signed in or not', () => {
		view({ user: 'someone-else', version: 1 });
		expect(screen.queryByRole('button', RESTORE)).toBeNull();
	});

	test('not when the older version reads the same as the latest: nothing to restore', () => {
		view({ user: 'a', version: 1, sameContent: true });
		expect(screen.queryByRole('button', RESTORE)).toBeNull();
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
	const cookHeader = () => document.querySelector('header.cook-header');

	test('not cooking: no data-cooking, the band, the bar and the actions show', () => {
		load();
		expect(article()).not.toHaveAttribute('data-cooking');
		expect(document.querySelector('.hero')).not.toBeNull();
		expect(bar()).not.toBeNull();
		expect(cookHeader()).toBeNull();
		expect(screen.getByRole('link', { name: 'Log in to save' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Cook' })).toBeInTheDocument();
	});

	test('Cook swaps the band for the cooking header, hides the bar, and writes ?cook=1', async () => {
		load();
		await fireEvent.click(screen.getByRole('link', { name: 'Cook' }));
		expect(article()).toHaveAttribute('data-cooking');
		expect(document.querySelector('.hero')).toBeNull();
		expect(bar()).toBeNull();
		expect(screen.queryByRole('link', { name: 'Log in to save' })).toBeNull();
		expect(cookHeader()).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument();
		expect(new URL(goto.mock.lastCall![0]).searchParams.get('cook')).toBe('1');
	});

	test('cooking, the title is the one h1, in the cooking header', () => {
		const data = makeData();
		load('?cook=1');
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings).toHaveLength(1);
		expect(cookHeader()).toContainElement(headings[0]);
		expect(headings[0]).toHaveTextContent(data.currentVersion.title);
	});

	// The scaler, a line below, says the serves being cooked.
	test('the cooking header leaves the serves to the scaler', () => {
		load('?cook=1&serves=6');
		expect(cookHeader()).not.toHaveTextContent('Serves');
	});

	test('Exit leaves cooking for the reading view, drops ?cook and keeps the ticks', async () => {
		load('?cook=1&serves=8');
		const step = () => document.querySelector<HTMLInputElement>('#method input')!;
		await fireEvent.click(step());
		expect(step().checked).toBe(true);
		await fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
		expect(article()).not.toHaveAttribute('data-cooking');
		expect(document.querySelector('.hero')).not.toBeNull();
		expect(bar()).not.toBeNull();
		const url = lastShallowUrl(goto);
		expect(url.searchParams.has('cook')).toBe(false);
		expect(url.searchParams.get('serves')).toBe('8');
		expect(step().checked).toBe(true);
		await fireEvent.click(step());
	});

	test('Finish cooking comes after the method, the one primary while cooking', () => {
		const { container } = load('?cook=1');
		const finish = screen.getByRole('button', { name: 'Finish cooking' });
		expect(finish).toHaveClass('btn-primary');
		expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
		const method = container.querySelector('#method')!;
		expect(method.compareDocumentPosition(finish) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(container.querySelector('.main')).toContainElement(finish);
	});

	test("the author's notes sit under the method, reading and cooking, before Finish", () => {
		const data = makeData();
		const withNotes = {
			...data,
			currentVersion: { ...data.currentVersion, notes: 'Rest it.', storage: 'Cold' }
		};
		page.url = new URL('http://localhost/recipes/cookies');
		const reading = render(Page, { props: { data: withNotes } });
		const notes = () => reading.container.querySelector<HTMLElement>('#notes')!;
		expect(reading.container.querySelector('.main')).toContainElement(notes());
		expect(notes()).toHaveTextContent('Rest it.');
		reading.unmount();

		page.url = new URL('http://localhost/recipes/cookies?cook=1');
		const { container } = render(Page, { props: { data: withNotes } });
		const finish = screen.getByRole('button', { name: 'Finish cooking' });
		const section = container.querySelector('#notes')!;
		expect(
			container.querySelector('#method')!.compareDocumentPosition(section) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		expect(section.compareDocumentPosition(finish) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	test('signed out, Finish cooking leaves cooking for the reading view', async () => {
		load('?cook=1');
		await fireEvent.click(screen.getByRole('button', { name: 'Finish cooking' }));
		expect(article()).not.toHaveAttribute('data-cooking');
		expect(goto).toHaveBeenCalledOnce();
		expect(lastShallowUrl(goto).searchParams.has('cook')).toBe(false);
	});

	test('signed in, Finish cooking leaves cooking, then opens the Journal entry for these serves', async () => {
		const ADD = '/journal/new?recipe=cookies&version=2';
		page.url = new URL('http://localhost/recipes/cookies?cook=1&serves=8');
		const data = { ...makeData(), user: { id: 'v' }, journal: { lastEntry: null, addHref: ADD } };
		render(Page, { props: { data: data as PageData } });
		await fireEvent.click(screen.getByRole('button', { name: 'Finish cooking' }));
		await tick();
		expect(goto).toHaveBeenCalledTimes(2);
		// First the cooking entry is replaced, so Back from the Journal returns to reading.
		const [dropped, opts] = goto.mock.calls[0];
		expect(opts).toMatchObject({ shallow: true, replace: true });
		expect(new URL(dropped).searchParams.has('cook')).toBe(false);
		expect(goto.mock.calls[1]).toEqual([`${ADD}&serves=8`]);
	});

	test('signed in, Add to Journal in the band carries a whole ?serves=', () => {
		const ADD = '/journal/new?recipe=cookies&version=2';
		const open = (search: string) => {
			page.url = new URL(`http://localhost/recipes/cookies${search}`);
			const data = { ...makeData(), user: { id: 'v' }, journal: { lastEntry: null, addHref: ADD } };
			return render(Page, { props: { data: data as PageData } });
		};
		const scaled = open('?serves=6');
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute(
			'href',
			`${ADD}&serves=6`
		);
		scaled.unmount();
		open('?serves=1.5');
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute('href', ADD);
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
		await fireEvent.click(screen.getByRole('link', { name: 'Cook' }));
		const url = new URL(goto.mock.lastCall![0]);
		expect(url.searchParams.get('version')).toBe('1');
		expect(url.searchParams.get('serves')).toBe('8');
		expect(url.searchParams.get('cook')).toBe('1');
		expect(article()).toHaveAttribute('data-version', '1');
	});

	test('a reload of that URL lands in Cook on the same version and scale, on Method', () => {
		page.url = new URL('http://localhost/recipes/cookies?version=1&serves=8&cook=1');
		const data = makeData();
		render(Page, { props: { data: { ...data, currentVersion: data.allVersions[1] } } });
		expect(article()).toHaveAttribute('data-cooking');
		expect(article()).toHaveAttribute('data-version', '1');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toHaveValue(8);
		expect(screen.getByRole('button', { name: 'Method' })).toHaveAttribute('aria-pressed', 'true');
	});

	test('only ?cook=1 cooks', () => {
		load('?cook=yes');
		expect(article()).not.toHaveAttribute('data-cooking');
	});

	test('cooking keeps the ticks, the scaler and the section switch', () => {
		load('?cook=1');
		expect(screen.getByRole('spinbutton', { name: 'Servings' })).toBeInTheDocument();
		expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
		expect(screen.getByRole('navigation', { name: 'Recipe sections' })).toBeInTheDocument();
	});
});

// While cooking each view keeps its own place: the ginger lookup (Spencer,
// 11 November 2026). jsdom does not scroll, so the window's scroll is a stand-in.
describe('recipe page cooking switch', () => {
	let y = 0;
	beforeEach(() => {
		y = 0;
		Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true });
		vi.spyOn(window, 'scrollTo').mockImplementation(((opts: ScrollToOptions) => {
			y = opts.top ?? y;
		}) as typeof window.scrollTo);
	});

	// The switch restores the scroll after the view has rendered.
	async function press(name: string) {
		await fireEvent.click(screen.getByRole('button', { name }));
		await tick();
	}

	test('switching restores each view to where it was, instantly, with no history entry', async () => {
		load('?cook=1');
		goto.mockClear();
		// The views start 150px down the page, under the cooking header.
		const content = document.getElementById('recipe')!;
		content.getBoundingClientRect = () => ({ top: 150 - y }) as DOMRect;
		y = 900;
		await press('Ingredients');
		// First visit: the view's top.
		expect(y).toBe(150);
		y = 120;
		await press('Method');
		expect(y).toBe(900);
		expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: 'instant' });
		await press('Ingredients');
		expect(y).toBe(120);
		expect(goto).not.toHaveBeenCalled();
	});

	test('the pressed segment is the view showing, and focus stays on it', async () => {
		load('?cook=1');
		const ingredients = screen.getByRole('button', { name: 'Ingredients' });
		ingredients.focus();
		await press('Ingredients');
		expect(ingredients).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Method' })).toHaveAttribute('aria-pressed', 'false');
		expect(document.activeElement).toBe(ingredients);
	});

	test('pressing the view already showing moves nothing', async () => {
		load('?cook=1');
		y = 400;
		await press('Method');
		expect(y).toBe(400);
	});

	test('entering Cook with steps ticked lands on the first open step', async () => {
		const data = makeData();
		const steps = [makeStep('One.'), makeStep('Two.'), makeStep('Three.')];
		saveTicks(ticksKey('cookies', 2, 'steps'), [0]);
		const into = vi.fn();
		Element.prototype.scrollIntoView = into;
		page.url = new URL('http://localhost/recipes/cookies');
		render(Page, {
			props: { data: { ...data, currentVersion: { ...data.currentVersion, steps } } }
		});
		await fireEvent.click(screen.getByRole('link', { name: 'Cook' }));
		await tick();
		expect(into).toHaveBeenCalledOnce();
		expect(into.mock.contexts[0]).toHaveTextContent('Two.');
		expect(screen.getByRole('button', { name: 'Method' })).toHaveAttribute('aria-pressed', 'true');
		saveTicks(ticksKey('cookies', 2, 'steps'), []);
	});

	test('entering Cook with nothing ticked starts at the top', async () => {
		const into = vi.fn();
		Element.prototype.scrollIntoView = into;
		load();
		y = 700;
		await fireEvent.click(screen.getByRole('link', { name: 'Cook' }));
		await tick();
		expect(into).not.toHaveBeenCalled();
		expect(y).toBe(0);
	});
});

describe('recipe page cooking CSS', () => {
	// jsdom applies no component CSS, so the rules are read from source; the
	// e2e spec pins the computed layout.
	test('one done language while cooking: neither list strikes a ticked row', () => {
		expect(cssRule(pageSource, 'article[data-cooking] :global(label:has(:checked))')).toMatch(
			/text-decoration-line: none;/
		);
	});

	test('the espresso bar and the site tab bar step aside while cooking', () => {
		expect(
			cssRule(pageSource, ':global(body:has(article[data-cooking]) :is(.nav-shell, .tab-bar))')
		).toMatch(/display: none;/);
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

describe('a saved recipe: Keep this version and the note', () => {
	const saved = (keptVersion: number | null, onVersion = 2) => {
		const data = makeData();
		return {
			...data,
			user: { id: 'saver' },
			isFavorited: true,
			journal: { lastEntry: null, addHref: '/journal/new?recipe=cookies&version=1' },
			profile: { measurement: 'metric' },
			save: { keptVersion, note: null },
			keptCopy: false,
			currentVersion: onVersion === 2 ? data.allVersions[0] : data.allVersions[1]
		} as unknown as PageData;
	};

	test('offers Keep this version and a note to the saver; the author gets neither', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		const { unmount } = render(Page, { props: { data: saved(null) } });
		expect(screen.getByRole('button', { name: 'Keep this version, v2' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Add a note' })).toBeInTheDocument();
		unmount();
		const own = { ...saved(null), user: { id: 'a' }, save: null } as unknown as PageData;
		render(Page, { props: { data: own } });
		expect(screen.queryByRole('button', { name: /Keep this version/ })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Add a note' })).toBeNull();
	});

	test('on the kept older version it reads like the latest: Save is offered and the cook’s units apply', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		render(Page, { props: { data: saved(1, 1) } });
		expect(screen.getByText(/^Keeping/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^Save/ })).toBeInTheDocument();
		expect(screen.getByText(/^Converted to metric/)).toBeInTheDocument();
		// Fork copies the version being read, so it is offered here too.
		const fork = screen.getByRole('button', { name: 'Fork' }).closest('form')!;
		expect(new FormData(fork).get('version')).toBe('1');
	});
});

describe('a kept copy of a recipe its author withdrew', () => {
	const copy = () => {
		const data = makeData();
		return {
			...data,
			user: { id: 'saver' },
			isFavorited: true,
			allVersions: [data.allVersions[1]],
			currentVersion: data.allVersions[1],
			journal: { lastEntry: null, addHref: '/journal/new?recipe=cookies&version=1' },
			collections: [],
			save: { keptVersion: null, note: 'Mine' },
			keptCopy: true
		} as unknown as PageData;
	};

	test('says it is no longer shared and is the saver’s alone, with Remove; no Save, Fork, counts or keep line', () => {
		page.url = new URL('http://localhost/recipes/cookies');
		render(Page, { props: { data: copy() } });
		expect(screen.getByText('No longer shared by the author')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Your copy of v1, as you saved it. Only you can see it; it can’t be shared or forked.'
			)
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Remove from Cookbook' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^Save/ })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Fork' })).toBeNull();
		expect(screen.queryByText(/No forks/)).toBeNull();
		expect(screen.queryByRole('button', { name: /Keep this version/ })).toBeNull();
		// Cook, Add to Journal and the note stay.
		expect(screen.getByRole('link', { name: 'Cook' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toBeInTheDocument();
		expect(screen.getByText('Mine')).toBeInTheDocument();
	});
});
