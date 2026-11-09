import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import RecipeActions from './RecipeActions.svelte';
import { compactCount } from '#lib/helpers.js';
import source from './RecipeActions.svelte?raw';
import { readFileSync } from 'node:fs';

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
		shallow: null as { url: URL } | null
	},
	navigated: [] as (() => void)[]
}));
vi.mock('$app/navigation', () => ({
	goto,
	afterNavigate: (callback: () => void) => navigated.push(callback)
}));
vi.mock('$app/state', () => ({ page }));

/** Runs the enhance flow for one form as SvelteKit would, ending in `result`. */
async function playBack(action: string, result: { type: string; location?: string }) {
	const form = document.querySelector<HTMLFormElement>(`form[action="${action}"]`)!;
	const handler = await submits.get(action)!({ formElement: form, cancel: () => {} });
	await handler({ result, update: async () => {} });
	await tick();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		recipe: { slug: 'cookies', title: 'Cookies' },
		canFork: false,
		canFavorite: true,
		canEdit: false,
		initialFavorited: false,
		favoriteCount: 0,
		cooking: false,
		oncook: () => {},
		...overrides
	};
}

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
		expect(button.textContent!.replace(/\s+/g, ' ').trim()).toBe(`Save · ${compactCount(1234)}`);
		// The dot is drawn for the eye only.
		expect(button.querySelector('.count [aria-hidden="true"]')).toHaveTextContent('·');
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
	const rule = (selector: string, from = style) => {
		const start = from.indexOf(`${selector} {`);
		expect(start, selector).toBeGreaterThan(-1);
		return from.slice(start, from.indexOf('}', start));
	};
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
		[...container.querySelectorAll<HTMLElement>('.actions a, .actions button')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);

	test('a visitor gets Cook in marigold first, then Save and Fork outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFork: true, favoriteCount: 3 })
		});
		expect(names(container)).toEqual(['Cook', 'Save · 3', 'Fork']);
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

	test('logged out: Cook, then a Log in to save link back here, and no Fork', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login?redirectTo=%2Frecipes%2Fcookies' })
		});
		expect(names(container)).toEqual(['Cook', 'Log in to save']);
		const login = screen.getByRole('link', { name: 'Log in to save' });
		expect(login).toHaveAttribute('href', '/login?redirectTo=%2Frecipes%2Fcookies');
		expect(login).not.toHaveClass('btn-primary');
		expect(login).not.toHaveClass('btn-ghost');
		expect(screen.queryByRole('link', { name: /fork/i })).toBeNull();
		expect(document.querySelector('form')).toBeNull();
	});

	test('with nothing else offered (logged out on an older version), only Cook is rendered', () => {
		render(RecipeActions, { props: makeProps({ canFavorite: false }) });
		expect(screen.getAllByRole('button')).toEqual([screen.getByRole('button', { name: 'Cook' })]);
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('the owner gets Cook, then Edit recipe outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canEdit: true, canFavorite: false })
		});
		expect(names(container)).toEqual(['Cook', 'Edit recipe']);
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
		// Cooking: Done cooking, then Add to Journal alone beneath.
		expect(lone({ cooking: true })).toBe(true);
	});
});

// ─── Cooking mode ─────────────────────────────────────────────────────────────

/** The URL handed to the last shallow navigation. */
function lastUrl(): URL {
	const [url, opts] = goto.mock.lastCall!;
	expect(opts).toMatchObject({ shallow: true, replace: true });
	return new URL(url);
}

describe('RecipeActions Cook toggle', () => {
	beforeEach(() => {
		goto.mockClear();
		page.shallow = null;
	});

	test.each([
		['logged out', { canFavorite: false, loginHref: '/login' }],
		['logged in', { canFork: true }],
		['the owner', { canEdit: true }],
		['on an older version', { canFavorite: false }]
	])('%s, the row offers Cook as an unpressed marigold pill, first', (_, overrides) => {
		const { container } = render(RecipeActions, { props: makeProps(overrides) });
		const cook = screen.getByRole('button', { name: 'Cook' });
		expect(cook).toHaveAttribute('aria-pressed', 'false');
		expect(cook).toHaveClass('btn-primary');
		expect(container.querySelector('.actions')!.firstElementChild).toBe(cook);
		expect(cook.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	test('cooking, it reads Done cooking, pressed, and the other actions go', () => {
		render(RecipeActions, { props: makeProps({ canFork: true, cooking: true }) });
		const done = screen.getByRole('button', { name: 'Done cooking' });
		expect(done).toHaveAttribute('aria-pressed', 'true');
		// Pressed, it steps down to the outlined pill with the marigold tint.
		expect(done).toHaveClass('btn-ghost');
		expect(done).not.toHaveClass('btn-primary');
		expect(screen.getAllByRole('button')).toEqual([done]);
	});

	test('logged out and cooking, the sign-in pills go too', () => {
		render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login', cooking: true })
		});
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('the pill holds only the word it shows, so no blank space is reserved', () => {
		const { rerender } = render(RecipeActions, { props: makeProps() });
		const cook = screen.getByRole('button', { name: 'Cook' });
		const words = () => cook.textContent!.replace(/\s+/g, ' ').trim();
		expect(words()).toBe('Cook');
		expect(cook.querySelector('.invisible')).toBeNull();
		rerender(makeProps({ cooking: true }));
		expect(words()).toBe('Done cooking');
	});

	test('pressed, the pill takes the Favorite on-state: marigold tint and border', () => {
		const style = source.slice(source.indexOf('<style>'));
		const start = style.indexOf(".cook[aria-pressed='true']");
		expect(start).toBeGreaterThan(-1);
		const rule = style.slice(start, style.indexOf('}', start));
		expect(rule).toMatch(/background:\s*var\(--color-marigold-tint\)/);
		expect(rule).toMatch(/border-color:\s*var\(--color-marigold\)/);
	});

	test('Cook hands back true and writes ?cook=1, keeping a shallow ?serves=', async () => {
		const oncook = vi.fn();
		page.shallow = { url: new URL('http://localhost/recipes/cookies?serves=8') };
		render(RecipeActions, { props: makeProps({ oncook }) });
		await fireEvent.click(screen.getByRole('button', { name: 'Cook' }));
		expect(oncook).toHaveBeenCalledWith(true);
		expect(lastUrl().searchParams.get('cook')).toBe('1');
		expect(lastUrl().searchParams.get('serves')).toBe('8');
		expect(lastUrl().pathname).toBe('/recipes/cookies');
	});

	test('Done cooking hands back false and drops ?cook', async () => {
		const oncook = vi.fn();
		page.url = new URL('http://localhost/recipes/cookies?cook=1&serves=2');
		render(RecipeActions, { props: makeProps({ oncook, cooking: true }) });
		await fireEvent.click(screen.getByRole('button', { name: 'Done cooking' }));
		expect(oncook).toHaveBeenCalledWith(false);
		expect(lastUrl().searchParams.has('cook')).toBe(false);
		expect(lastUrl().searchParams.get('serves')).toBe('2');
		page.url = new URL('http://localhost/recipes/cookies');
	});
});

describe('RecipeActions wake lock', () => {
	type Sentinel = { released: boolean; release: ReturnType<typeof vi.fn> };
	let sentinels: Sentinel[];
	let request: ReturnType<typeof vi.fn>;

	function setVisibility(state: 'visible' | 'hidden') {
		Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
		document.dispatchEvent(new Event('visibilitychange'));
	}

	beforeEach(() => {
		sentinels = [];
		request = vi.fn(async () => {
			const sentinel: Sentinel = {
				released: false,
				release: vi.fn(async () => {
					sentinel.released = true;
				})
			};
			sentinels.push(sentinel);
			return sentinel;
		});
		Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
	});

	afterEach(() => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		Reflect.deleteProperty(document, 'visibilityState');
	});

	test('not cooking, no lock is asked for', async () => {
		render(RecipeActions, { props: makeProps() });
		await tick();
		expect(request).not.toHaveBeenCalled();
	});

	test('cooking, the screen lock is requested and no note shows', async () => {
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await tick();
		expect(request).toHaveBeenCalledWith('screen');
		expect(screen.queryByText('Your screen may still sleep.')).toBeNull();
	});

	test('the browser drops the lock when the tab hides; coming back asks again', async () => {
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		sentinels[0].released = true;
		setVisibility('hidden');
		expect(request).toHaveBeenCalledTimes(1);
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(2);
	});

	test('a lock still held is not asked for twice', async () => {
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(1);
	});

	test('Done releases the lock, and the tab coming back does not ask again', async () => {
		const { rerender } = render(RecipeActions, { props: makeProps({ cooking: true }) });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		await rerender(makeProps({ cooking: false }));
		expect(sentinels[0].release).toHaveBeenCalled();
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(1);
	});

	test('leaving the page releases the lock', async () => {
		const { unmount } = render(RecipeActions, { props: makeProps({ cooking: true }) });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		unmount();
		expect(sentinels[0].release).toHaveBeenCalled();
	});

	test('unloading releases the lock', async () => {
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		window.dispatchEvent(new Event('pagehide'));
		expect(sentinels[0].release).toHaveBeenCalled();
		// Back from the back-forward cache, still cooking: the lock comes back.
		setVisibility('visible');
		expect(request).toHaveBeenCalledTimes(2);
	});

	test('a lock that arrives after Done is let go at once', async () => {
		const { rerender } = render(RecipeActions, { props: makeProps({ cooking: true }) });
		await rerender(makeProps({ cooking: false }));
		await vi.waitFor(() => expect(sentinels).toHaveLength(1));
		await vi.waitFor(() => expect(sentinels[0].release).toHaveBeenCalled());
	});

	test('a refused lock does not throw; cooking goes on', async () => {
		request.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await tick();
		await tick();
		expect(screen.getByRole('button', { name: 'Done cooking' })).toBeInTheDocument();
	});

	test('without the API cooking still works and one line says the screen may sleep', async () => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		render(RecipeActions, { props: makeProps({ cooking: true }) });
		await tick();
		expect(screen.getByRole('button', { name: 'Done cooking' })).toBeInTheDocument();
		// Ink 2: Ink 3 is 4.46:1 on the band, under AA for this size.
		expect(screen.getByText('Your screen may still sleep.')).toHaveClass('text-text-2');
	});

	test('without the API and not cooking, no note', async () => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		render(RecipeActions, { props: makeProps() });
		await tick();
		expect(screen.queryByText('Your screen may still sleep.')).toBeNull();
	});
});

// ─── Add to Journal while cooking ─────────────────────────────────────────────

describe('RecipeActions Add to Journal', () => {
	const HREF = '/journal/new?recipe=cookies&version=3';

	test('beside Done cooking, carrying the version and the serves being cooked', () => {
		page.shallow = { url: new URL('http://localhost/recipes/cookies?cook=1&serves=24') };
		render(RecipeActions, { props: makeProps({ cooking: true, journalHref: HREF }) });
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute(
			'href',
			`${HREF}&serves=24`
		);
		page.shallow = null;
	});

	test('the book icon comes first, hidden, so the name is the label alone', () => {
		render(RecipeActions, { props: makeProps({ journalHref: HREF }) });
		const link = screen.getByRole('link', { name: 'Add to Journal' });
		expect(link.firstElementChild?.tagName).toBe('svg');
		expect(link.firstElementChild).toHaveAttribute('aria-hidden', 'true');
	});

	test('signed out there is none, cooking or not', () => {
		const idle = render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login' })
		});
		expect(screen.queryByRole('link', { name: 'Add to Journal' })).toBeNull();
		idle.unmount();

		render(RecipeActions, { props: makeProps({ cooking: true }) });
		expect(screen.queryByRole('link', { name: 'Add to Journal' })).toBeNull();
	});
});

// ─── Add to Journal in the row ────────────────────────────────────────────────

describe('RecipeActions Add to Journal in the row', () => {
	const HREF = '/journal/new?recipe=cookies&version=3';
	const names = (container: HTMLElement) =>
		[...container.querySelectorAll<HTMLElement>('.actions a, .actions button')].map((el) =>
			el.textContent!.replace(/\s+/g, ' ').trim()
		);

	test('the owner gets Cook, Edit recipe, then Add to Journal outlined', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canEdit: true, canFavorite: false, journalHref: HREF })
		});
		expect(names(container)).toEqual(['Cook', 'Edit recipe', 'Add to Journal']);
		const add = screen.getByRole('link', { name: 'Add to Journal' });
		expect(add).toHaveClass('btn-ghost');
		expect(add).toHaveAttribute('href', HREF);
	});

	test('a visitor gets Cook, Save, Fork, then Add to Journal, carrying the serves', () => {
		page.shallow = { url: new URL('http://localhost/recipes/cookies?serves=6') };
		const { container } = render(RecipeActions, {
			props: makeProps({ canFork: true, favoriteCount: 3, journalHref: HREF })
		});
		expect(names(container)).toEqual(['Cook', 'Save · 3', 'Fork', 'Add to Journal']);
		expect(screen.getByRole('link', { name: 'Add to Journal' })).toHaveAttribute(
			'href',
			`${HREF}&serves=6`
		);
		page.shallow = null;
	});

	test('cooking, it is the only action beside Done cooking', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFork: true, cooking: true, journalHref: HREF })
		});
		expect(names(container)).toEqual(['Done cooking', 'Add to Journal']);
	});
});
