import { describe, test, expect, vi, beforeEach } from 'vitest';
import { lastShallowUrl } from '#lib/testing/navigation.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import RecipeActions from './RecipeActions.svelte';
import { compactCount } from '#lib/helpers.js';
import { EXPORT_FORMATS, exportHref } from '#lib/export/archive.js';
import source from './RecipeActions.svelte?raw';
import { readFileSync } from 'node:fs';
import { cssRule, cssRules } from '#lib/testing/css.js';

// Each form's enhance callback is captured so a test can play back a result.
type Submit = (input: {
	formElement: HTMLFormElement;
	cancel: () => void;
}) => Promise<(opts: { result: { type: string }; update: () => Promise<void> }) => Promise<void>>;
const { submits } = vi.hoisted(() => ({ submits: new Map<string, Submit>() }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: Submit) => {
		submits.set(form.getAttribute('action')!, submit);
		return { destroy: () => {} };
	}
}));

// Cook writes ?cook=1 with the shallow replace the scaler uses.
// afterNavigate's callbacks are kept so a test can play a navigation back.
const { goto, page, navigated } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: {
		url: new URL('http://localhost/recipes/cookies'),
		state: {},
		shallow: null as { url: URL } | null,
		data: { user: null as { id: string } | null }
	},
	navigated: [] as (() => void)[]
}));
vi.mock('$app/navigation', () => ({
	goto,
	afterNavigate: (callback: () => void) => navigated.push(callback)
}));
vi.mock('$app/state', () => ({ page }));

/** Runs the enhance flow for one form as SvelteKit would, ending in `result`. */
async function playBack(
	action: string,
	result: { type: string; location?: string; status?: number; data?: Record<string, unknown> }
) {
	const form = document.querySelector<HTMLFormElement>(`form[action="${action}"]`)!;
	const handler = await submits.get(action)!({ formElement: form, cancel: () => {} });
	await handler({ result, update: async () => {} });
	await tick();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		recipe: { slug: 'cookies', title: 'Cookies', authorId: 'author-1' },
		canFork: false,
		canFavorite: true,
		canEdit: false,
		initialFavorited: false,
		favoriteCount: 0,
		oncook: () => {},
		...overrides
	};
}

// ─── More actions ─────────────────────────────────────────────────────────────

describe('RecipeActions More actions', () => {
	test.each([
		['the owner', { canEdit: true, canFavorite: false, journalHref: '/journal/new' }],
		['a visitor', { canFork: true, journalHref: '/journal/new' }],
		['logged out', { canFavorite: false, loginHref: '/login' }],
		['on an older version', { canFavorite: false }]
	])('%s gets the More trigger last in the row', (_, overrides) => {
		const { container } = render(RecipeActions, { props: makeProps(overrides) });
		const more = screen.getByRole('button', { name: 'More actions' });
		expect(container.querySelector('.actions')!.lastElementChild).toContain(more);
	});

	test('Add to collection is no pill: its collections sit in the More menu', async () => {
		render(RecipeActions, {
			props: makeProps({ canFork: true, collections: [{ id: 1, name: 'To cook', has: false }] })
		});
		expect(screen.queryByRole('button', { name: 'Add to collection' })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
		await tick();
		const menu = screen.getByRole('menu', { name: 'More actions' });
		expect(menu).toContainElement(screen.getByRole('menuitemcheckbox', { name: 'To cook' }));
	});

	test('outside the library the menu offers Print alone', async () => {
		render(RecipeActions, { props: makeProps({ collections: null }) });
		await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
		await tick();
		expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
		expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument();
	});

	// The export is the whole recipe, so the owner gets it on every version,
	// not only the latest where Edit shows (Spencer, 11 November 2026).
	test.each([
		['the owner on the latest version', 'author-1', true, true],
		['the owner on an older version', 'author-1', false, true],
		['a signed-in visitor', 'someone-else', false, false],
		['someone signed out', null, false, false]
	])('%s: Export rows for this recipe in the menu, or none', async (_, viewer, canEdit, rows) => {
		page.data.user = viewer ? { id: viewer } : null;
		render(RecipeActions, {
			props: makeProps({
				canEdit,
				recipe: { slug: 'brown-butter-buns', title: 'Buns', authorId: 'author-1' }
			})
		});
		await fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
		await tick();
		const hrefs = screen
			.queryAllByRole('menuitem', { name: /^Export/ })
			.map((a) => a.getAttribute('href'));
		expect(hrefs).toEqual(
			rows ? EXPORT_FORMATS.map((f) => exportHref(f, 'brown-butter-buns')) : []
		);
		page.data.user = null;
	});
});

// ─── Save button ──────────────────────────────────────────────────────────────

describe('RecipeActions save button', () => {
	test('reflects the initial saved state in aria-pressed, the word stays Save', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		// The visible word is the accessible name: no aria-label saying something else.
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).not.toHaveAttribute('aria-label');
	});

	test('is a toggle button: pressed while favourited, and flips as it submits', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false');
		await playBack('?/toggleFavorite', { type: 'success' });
		expect(screen.getByRole('button', { name: /^Save/ })).toHaveAttribute('aria-pressed', 'true');
	});

	test('the bookmark is decoration: the word is the name', () => {
		render(RecipeActions, { props: makeProps() });
		const star = screen.getByRole('button', { name: 'Save' }).querySelector('svg')!;
		expect(star).toHaveAttribute('aria-hidden', 'true');
	});

	test('the saved bookmark is a marigold fill on an ink edge, not clay', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		const star = screen.getByRole('button', { name: 'Save' }).querySelector('svg')!;
		expect(star).toHaveClass('fill-marigold');
		expect(star).not.toHaveClass('fill-accent');
		expect(star).not.toHaveClass('text-accent');
		expect(star).toHaveAttribute('stroke', 'currentColor');
	});

	test('the unpressed bookmark stays an outline in the button ink', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		const star = screen.getByRole('button', { name: 'Save' }).querySelector('svg')!;
		expect(star).toHaveClass('fill-none');
		expect(star).not.toHaveClass('fill-marigold');
	});

	test('carries the save count after the word, compact', () => {
		render(RecipeActions, { props: makeProps({ favoriteCount: 1234 }) });
		const button = screen.getByRole('button', { name: /^Save/ });
		expect(button.textContent!.replace(/\s+/g, ' ').trim()).toBe(`Save ${compactCount(1234)}`);
		// The dot is drawn for the eye only, by app.css's .dot-list.
		expect(button.querySelector('.count')!.parentElement).toHaveClass('dot-list');
	});

	test('with no saves the pill says Save alone', () => {
		render(RecipeActions, { props: makeProps({ favoriteCount: 0 }) });
		expect(screen.getByRole('button', { name: 'Save' }).querySelector('.count')).toBeNull();
	});

	test('the count moves with the toggle at once, and back if the save fails', async () => {
		render(RecipeActions, { props: makeProps({ favoriteCount: 7 }) });
		const count = () => document.querySelector('.count')!.textContent!.replace(/\D/g, '');
		const form = document.querySelector<HTMLFormElement>('form[action="?/toggleFavorite"]')!;
		const handler = await submits.get('?/toggleFavorite')!({ formElement: form, cancel: () => {} });
		await tick();
		expect(count()).toBe('8');
		await handler({ result: { type: 'error' }, update: async () => {} });
		await tick();
		expect(count()).toBe('7');
	});

	test('unsaving takes one off the count', async () => {
		render(RecipeActions, { props: makeProps({ favoriteCount: 7, initialFavorited: true }) });
		const form = document.querySelector<HTMLFormElement>('form[action="?/toggleFavorite"]')!;
		await submits.get('?/toggleFavorite')!({ formElement: form, cancel: () => {} });
		await tick();
		expect(document.querySelector('.count')!.textContent!.replace(/\D/g, '')).toBe('6');
	});

	test('follows the prop when the page moves to a recipe with a different state', async () => {
		// Navigating from one recipe to another (e.g. a fork's "Forked from" link)
		// reuses this component, so only the prop changes.
		const { rerender } = render(RecipeActions, { props: makeProps({ initialFavorited: true }) });

		await rerender(
			makeProps({ recipe: { slug: 'original', title: 'Original' }, initialFavorited: false })
		);

		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false');
	});
});

// ─── Pressed look ─────────────────────────────────────────────────────────────

describe('RecipeActions favorited look', () => {
	// jsdom applies no component CSS, so the rules are read from the source.
	const style = source.slice(source.indexOf('<style>'));
	const rule = (selector: string, from = style) => cssRule(from, selector);
	const pressed = ".favorite[aria-pressed='true']";

	test('the favorite button carries the class the pressed rules hang on', () => {
		render(RecipeActions, { props: makeProps() });
		expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('favorite');
	});

	test('pressed, the pill is the marigold tint with a marigold border (Spencer, 31 October 2026)', () => {
		expect(rule(pressed)).toMatch(/background:\s*var\(--color-marigold-tint\)/);
		expect(rule(pressed)).toMatch(/border-color:\s*var\(--color-marigold\)/);
	});

	test('pressed, hover goes a touch deeper so the button still reacts', () => {
		expect(rule(`${pressed}:hover`)).toMatch(/background:\s*var\(--color-marigold-tint-hover\)/);
	});

	test('the tint tokens are defined once in app.css', () => {
		const appCss = readFileSync('src/app.css', 'utf8');
		const root = appCss.slice(appCss.indexOf(':root {'));
		expect(root.match(/--color-marigold-tint:\s*#[0-9a-f]{6};/gi)).toHaveLength(1);
		expect(root.match(/--color-marigold-tint-hover:\s*#[0-9a-f]{6};/gi)).toHaveLength(1);
	});

	test('forced colours: pressed gets a 2px border and a Highlight star, like the ticks', () => {
		const forced = style.slice(style.indexOf('@media (forced-colors: active)'));
		expect(forced.length).toBeLessThan(style.length);
		expect(rule(pressed, forced)).toMatch(/border-width:\s*2px/);
		// :global, because the star comes from Icons.svelte and scoped CSS would miss it.
		const star = rule(`${pressed} :global(svg)`, forced);
		expect(star).toMatch(/forced-color-adjust:\s*none/);
		expect(star).toMatch(/fill:\s*Highlight/);
	});
});

// ─── Failure states ───────────────────────────────────────────────────────────

describe('RecipeActions when a request fails', () => {
	test('a favourite that fails flips back and says so', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		await playBack('?/toggleFavorite', { type: 'error' });
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
	});

	test('a fork that fails says so and offers the button again', async () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		await playBack('?/fork', { type: 'error' });
		expect(screen.getByRole('alert')).toHaveTextContent(/could not fork/i);
		expect(screen.getByRole('button', { name: 'Fork' })).not.toBeDisabled();
	});

	test('a signed-out fork says the session ended, in the alert', async () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		const words = SESSION_ENDED('try again');
		await playBack('?/fork', { type: 'failure', status: 401, data: { error: words } });
		expect(screen.getByRole('alert')).toHaveTextContent(words);
	});

	test('a fork that succeeds stays disabled while the browser leaves, so it cannot fork twice', async () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		await playBack('?/fork', { type: 'redirect', location: '/recipes/cookies-abc/edit' });
		expect(screen.getByRole('button', { name: 'Fork' })).toBeDisabled();
	});

	test('Back from the new fork, restored from the back-forward cache, offers Fork again', async () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		await playBack('?/fork', { type: 'redirect', location: '/recipes/cookies-abc/edit' });
		const shown = new Event('pageshow');
		Object.defineProperty(shown, 'persisted', { value: true });
		window.dispatchEvent(shown);
		await tick();
		expect(screen.getByRole('button', { name: 'Fork' })).not.toBeDisabled();
	});

	test('the message goes when the page moves to another version or recipe', async () => {
		navigated.length = 0;
		render(RecipeActions, { props: makeProps() });
		await playBack('?/toggleFavorite', { type: 'error' });
		expect(screen.getByRole('alert')).toBeInTheDocument();
		for (const callback of navigated) callback();
		await tick();
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('a second press while a favourite is saving is cancelled and flips nothing', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		const form = document.querySelector<HTMLFormElement>('form[action="?/toggleFavorite"]')!;
		const submit = submits.get('?/toggleFavorite')!;
		const handler = await submit({ formElement: form, cancel: () => {} });
		await tick();
		const cancel = vi.fn();
		await submit({ formElement: form, cancel });
		await tick();
		expect(cancel).toHaveBeenCalled();
		const button = screen.getByRole('button', { name: /^Save/ });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		// Once the first answers, a press goes through again.
		await handler({ result: { type: 'success' }, update: async () => {} });
		const next = vi.fn();
		await submit({ formElement: form, cancel: next });
		expect(next).not.toHaveBeenCalled();
	});
});

// ─── Primary action ───────────────────────────────────────────────────────────

describe('RecipeActions row', () => {
	const names = (container: HTMLElement) =>
		[...container.querySelectorAll<HTMLElement>('.actions a, .actions button')].map(
			(el) => el.textContent!.replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label')
		);

	test('a visitor gets Cook in marigold first, then Save and Fork outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFork: true, favoriteCount: 3 })
		});
		expect(names(container)).toEqual(['Cook', 'Save 3', 'Fork', 'More actions']);
		expect(screen.getByRole('button', { name: 'Cook' })).toHaveClass('btn-primary');
		expect(screen.getByRole('button', { name: /^Save/ })).toHaveClass('btn-ghost');
		expect(screen.getByRole('button', { name: 'Fork' })).toHaveClass('btn-ghost');
	});

	test('Cook is the only filled control in every state', () => {
		for (const overrides of [
			{ canFork: true },
			{ canEdit: true },
			{ canFavorite: false, loginHref: '/login' }
		]) {
			const { container, unmount } = render(RecipeActions, { props: makeProps(overrides) });
			expect([...container.querySelectorAll('.btn-primary')]).toEqual([
				screen.getByRole('button', { name: 'Cook' })
			]);
			unmount();
		}
	});

	test('forking is one click: the button submits the fork, there is no dialog', () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		const fork = screen.getByRole('button', { name: 'Fork' });
		expect(fork).toHaveAttribute('type', 'submit');
		expect(fork.closest('form')).toHaveAttribute('action', '?/fork');
		expect(document.querySelector('dialog')).toBeNull();
	});

	test('Fork sends the version being read, which the server copies', () => {
		render(RecipeActions, { props: makeProps({ canFork: true, forkVersion: 2 }) });
		const form = screen.getByRole('button', { name: 'Fork' }).closest('form')!;
		expect(new FormData(form).get('version')).toBe('2');
	});

	test('logged out: Cook, then a ghost Log in to save pill back here, and no Fork', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login?redirectTo=%2Frecipes%2Fcookies' })
		});
		expect(names(container)).toEqual(['Cook', 'Log in to save', 'More actions']);
		const login = screen.getByRole('link', { name: 'Log in to save' });
		expect(login).toHaveAttribute('href', '/login?redirectTo=%2Frecipes%2Fcookies');
		expect(login).toHaveClass('btn-ghost');
		// The Save pill's own bookmark, unfilled.
		expect(login.querySelector('svg')).not.toBeNull();
		expect(screen.queryByRole('link', { name: /fork/i })).toBeNull();
		expect(document.querySelector('form')).toBeNull();
	});

	test('with nothing else offered (logged out on an older version), only Cook and More are rendered', () => {
		render(RecipeActions, { props: makeProps({ canFavorite: false }) });
		expect(screen.getAllByRole('button')).toEqual([
			screen.getByRole('button', { name: 'Cook' }),
			screen.getByRole('button', { name: 'More actions' })
		]);
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('the owner gets Cook, then Edit recipe outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canEdit: true, canFavorite: false })
		});
		expect(names(container)).toEqual(['Cook', 'Edit recipe', 'More actions']);
		const edit = screen.getByRole('link', { name: 'Edit recipe' });
		expect(edit).toHaveClass('btn-ghost');
		expect(edit).toHaveAttribute('href', '/recipes/cookies/edit');
	});

	test('on a phone Cook and the login link span the row; a lone last pill spans too', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		const style = source.slice(source.indexOf('<style>'));
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
		const spans = phone.match(/([^{}]*)\{[^}]*grid-column:\s*1 \/ -1/)![1];
		for (const selector of ['.cook', '.login', '.log:nth-child(even)']) {
			expect(spans).toContain(selector);
		}
		// Edit now has Add to Journal beside it.
		expect(spans).not.toContain('.edit');
		expect(phone).toMatch(/grid-template-columns:\s*1fr 1fr/);
	});

	test('on a phone More takes the end of Cook’s row, out of the pairing', () => {
		const style = source.slice(source.indexOf('<style>'));
		const phone = style.slice(style.indexOf('@media (max-width: 699px)'));
		expect(cssRule(phone, '.actions > :global(.dropdown)')).toMatch(/position:\s*absolute/);
		expect(cssRule(phone, '.actions > :global(.dropdown)')).toMatch(/right:\s*0/);
		// Cook leaves the trigger's 44px and the row's 10px gap.
		expect(cssRules(phone, '.cook').join()).toMatch(/margin-right:\s*54px/);
	});

	test('on a phone Add to Journal spans only when it would sit alone after Cook', () => {
		const lone = (overrides: Record<string, unknown>) => {
			const { unmount } = render(RecipeActions, {
				props: makeProps({ journalHref: '/journal/new?recipe=cookies&version=3', ...overrides })
			});
			const even = screen.getByRole('link', { name: 'Add to Journal' }).matches(':nth-child(even)');
			unmount();
			return even;
		};
		// Visitor: Cook, then Save and Fork share a row, Add to Journal takes the next whole.
		expect(lone({ canFork: true })).toBe(true);
		// Owner: Cook, then Edit and Add to Journal share a row.
		expect(lone({ canEdit: true, canFavorite: false })).toBe(false);
	});
});

// ─── Cook ─────────────────────────────────────────────────────────────────────

// Cook only enters cooking: the cooking view has its own header, with Exit,
// and Finish cooking after the method; this row is not there while cooking.
describe('RecipeActions Cook', () => {
	beforeEach(() => {
		goto.mockClear();
		page.shallow = null;
	});

	test.each([
		['logged out', { canFavorite: false, loginHref: '/login' }],
		['logged in', { canFork: true }],
		['the owner', { canEdit: true }],
		['on an older version', { canFavorite: false }]
	])('%s, the row offers Cook as a marigold pill, first', (_, overrides) => {
		const { container } = render(RecipeActions, { props: makeProps(overrides) });
		const cook = screen.getByRole('button', { name: 'Cook' });
		expect(cook).toHaveClass('btn-primary');
		expect(container.querySelector('.actions')!.firstElementChild).toBe(cook);
		expect(cook.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	test('it is an action, not a toggle: no pressed state', () => {
		render(RecipeActions, { props: makeProps() });
		expect(screen.getByRole('button', { name: 'Cook' })).not.toHaveAttribute('aria-pressed');
	});

	test('Cook hands back and writes ?cook=1, keeping a shallow ?serves=', async () => {
		const oncook = vi.fn();
		page.shallow = { url: new URL('http://localhost/recipes/cookies?serves=8') };
		render(RecipeActions, { props: makeProps({ oncook }) });
		await fireEvent.click(screen.getByRole('button', { name: 'Cook' }));
		expect(oncook).toHaveBeenCalledOnce();
		expect(lastShallowUrl(goto).searchParams.get('cook')).toBe('1');
		expect(lastShallowUrl(goto).searchParams.get('serves')).toBe('8');
		expect(lastShallowUrl(goto).pathname).toBe('/recipes/cookies');
	});
});

// ─── Add to Journal ───────────────────────────────────────────────────────────

describe('RecipeActions Add to Journal', () => {
	const HREF = '/journal/new?recipe=cookies&version=3';

	test('the book icon comes first, hidden, so the name is the label alone', () => {
		render(RecipeActions, { props: makeProps({ journalHref: HREF }) });
		const link = screen.getByRole('link', { name: 'Add to Journal' });
		expect(link.firstElementChild?.tagName).toBe('svg');
		expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
	});

	test('signed out there is none', () => {
		render(RecipeActions, { props: makeProps({ canFavorite: false, loginHref: '/login' }) });
		expect(screen.queryByRole('link', { name: 'Add to Journal' })).toBeNull();
	});
});

// ─── Add to Journal in the row ────────────────────────────────────────────────

describe('RecipeActions Add to Journal in the row', () => {
	const HREF = '/journal/new?recipe=cookies&version=3';
	const names = (container: HTMLElement) =>
		[...container.querySelectorAll<HTMLElement>('.actions a, .actions button')].map(
			(el) => el.textContent!.replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label')
		);

	test('the owner gets Cook, Edit recipe, then Add to Journal outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canEdit: true, canFavorite: false, journalHref: HREF })
		});
		expect(names(container)).toEqual(['Cook', 'Edit recipe', 'Add to Journal', 'More actions']);
		const add = screen.getByRole('link', { name: 'Add to Journal' });
		expect(add).toHaveClass('btn-ghost');
		expect(add).toHaveAttribute('href', HREF);
	});

	test('a visitor gets Cook, Save, Fork, then Add to Journal, to the link the page gives', () => {
		const href = `${HREF}&serves=6`;
		const { container } = render(RecipeActions, {
			props: makeProps({ canFork: true, favoriteCount: 3, journalHref: href })
		});
		expect(names(container)).toEqual(['Cook', 'Save 3', 'Fork', 'Add to Journal', 'More actions']);
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute('href', href);
	});
});
