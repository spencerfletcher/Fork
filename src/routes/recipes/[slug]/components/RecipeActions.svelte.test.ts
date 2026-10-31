import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import RecipeActions from './RecipeActions.svelte';
import source from './RecipeActions.svelte?raw';
import { readFileSync } from 'node:fs';

// Each form's enhance callback is captured so a test can play back a result.
type Submit = (input: {
	formElement: HTMLFormElement;
}) => Promise<(opts: { result: { type: string }; update: () => Promise<void> }) => Promise<void>>;
const { submits } = vi.hoisted(() => ({ submits: new Map<string, Submit>() }));
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: Submit) => {
		submits.set(form.getAttribute('action')!, submit);
		return { destroy: () => {} };
	}
}));

// Cook writes ?cook=1 with the shallow replace the scaler uses.
const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: {
		url: new URL('http://localhost/recipes/cookies'),
		state: {},
		shallow: null as { url: URL } | null
	}
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page }));

/** Runs the enhance flow for one form as SvelteKit would, ending in `result`. */
async function playBack(action: string, result: { type: string; location?: string }) {
	const form = document.querySelector<HTMLFormElement>(`form[action="${action}"]`)!;
	const handler = await submits.get(action)!({ formElement: form });
	await handler({ result, update: async () => {} });
	await tick();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		recipe: { slug: 'cookies', title: 'Cookies' },
		canFork: false,
		canFavorite: true,
		isOwner: false,
		isViewingHistory: false,
		initialFavorited: false,
		cooking: false,
		oncook: () => {},
		...overrides
	};
}

// ─── Save button ──────────────────────────────────────────────────────────────

describe('RecipeActions save button', () => {
	test('reflects the initial favourite state in aria-pressed, the word stays Favorite', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		// The visible word is the accessible name: no aria-label saying something else.
		const button = screen.getByRole('button', { name: 'Favorite' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).not.toHaveAttribute('aria-label');
	});

	test('is a toggle button: pressed while favourited, and flips as it submits', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		await playBack('?/toggleFavorite', { type: 'success' });
		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('the star is decoration: the word is the name', () => {
		render(RecipeActions, { props: makeProps() });
		const star = screen.getByRole('button', { name: 'Favorite' }).querySelector('svg')!;
		expect(star).toHaveAttribute('aria-hidden', 'true');
	});

	test('the favorited star is a marigold fill on an ink edge, not clay', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		const star = screen.getByRole('button', { name: 'Favorite' }).querySelector('svg')!;
		expect(star).toHaveClass('fill-marigold');
		expect(star).not.toHaveClass('fill-accent');
		expect(star).not.toHaveClass('text-accent');
		expect(star).toHaveAttribute('stroke', 'currentColor');
	});

	test('the unpressed star stays an outline in the button ink', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		const star = screen.getByRole('button', { name: 'Favorite' }).querySelector('svg')!;
		expect(star).toHaveClass('fill-none');
		expect(star).not.toHaveClass('fill-marigold');
	});

	test('follows the prop when the page moves to a recipe with a different state', async () => {
		// Navigating from one recipe to another (e.g. a fork's "Forked from" link)
		// reuses this component, so only the prop changes.
		const { rerender } = render(RecipeActions, { props: makeProps({ initialFavorited: true }) });

		await rerender(
			makeProps({ recipe: { slug: 'original', title: 'Original' }, initialFavorited: false })
		);

		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
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
		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveClass('favorite');
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
		const star = rule(`${pressed} svg`, forced);
		expect(star).toMatch(/forced-color-adjust:\s*none/);
		expect(star).toMatch(/fill:\s*Highlight/);
	});
});

// ─── Failure states ───────────────────────────────────────────────────────────

describe('RecipeActions when a request fails', () => {
	test('a favourite that fails flips back and says so', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		await playBack('?/toggleFavorite', { type: 'error' });
		expect(screen.getByRole('button', { name: 'Favorite' })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
	});

	test('a fork that fails says so and offers the button again', async () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		await playBack('?/fork', { type: 'error' });
		expect(screen.getByRole('alert')).toHaveTextContent(/could not fork/i);
		expect(screen.getByRole('button', { name: 'Fork this recipe' })).not.toBeDisabled();
	});
});

// ─── Primary action ───────────────────────────────────────────────────────────

describe('RecipeActions primary action', () => {
	test('a visitor who can fork gets Fork in marigold and Favorite outlined', () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		expect(screen.getByRole('button', { name: 'Fork this recipe' })).toHaveClass('btn-primary');
		expect(screen.getByRole('button', { name: /favorite/i })).toHaveClass('btn-ghost');
	});

	test('forking is one click: the button submits the fork, there is no dialog', () => {
		render(RecipeActions, { props: makeProps({ canFork: true }) });
		const fork = screen.getByRole('button', { name: 'Fork this recipe' });
		expect(fork).toHaveAttribute('type', 'submit');
		expect(fork.closest('form')).toHaveAttribute('action', '?/fork');
		expect(document.querySelector('dialog')).toBeNull();
	});

	test('logged out, Fork and Favorite lead to login and back here', () => {
		render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login?redirectTo=%2Frecipes%2Fcookies' })
		});
		const fork = screen.getByRole('link', { name: 'Fork this recipe' });
		expect(fork).toHaveClass('btn-primary');
		expect(fork).toHaveAttribute('href', '/login?redirectTo=%2Frecipes%2Fcookies');
		const favorite = screen.getByRole('link', { name: 'Favorite' });
		expect(favorite).toHaveClass('btn-ghost');
		expect(favorite).toHaveAttribute('href', '/login?redirectTo=%2Frecipes%2Fcookies');
		expect(document.querySelector('form')).toBeNull();
	});

	test('logged out on an older version, only Cook is rendered', () => {
		render(RecipeActions, {
			props: makeProps({ canFavorite: false, isViewingHistory: true, loginHref: '/login' })
		});
		expect(screen.getAllByRole('button')).toEqual([screen.getByRole('button', { name: 'Cook' })]);
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('the owner gets Edit in marigold, first, since Fork is not offered', () => {
		render(RecipeActions, { props: makeProps({ isOwner: true }) });
		const edit = screen.getByRole('link', { name: /edit recipe/i });
		expect(edit).toHaveClass('btn-primary');
		const favorite = screen.getByRole('button', { name: /favorite/i });
		expect(edit.compareDocumentPosition(favorite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
		['the owner', { isOwner: true }],
		['on an older version', { canFavorite: false, isViewingHistory: true }]
	])('%s, the row offers Cook as an unpressed ghost pill, last', (_, overrides) => {
		const { container } = render(RecipeActions, { props: makeProps(overrides) });
		const cook = screen.getByRole('button', { name: 'Cook' });
		expect(cook).toHaveAttribute('aria-pressed', 'false');
		expect(cook).toHaveClass('btn-ghost');
		expect(container.querySelector('.actions')!.lastElementChild).toBe(cook);
		expect(cook.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	test('cooking, it reads Done cooking, pressed, and the other actions go', () => {
		render(RecipeActions, { props: makeProps({ canFork: true, cooking: true }) });
		const done = screen.getByRole('button', { name: 'Done cooking' });
		expect(done).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getAllByRole('button')).toEqual([done]);
	});

	test('logged out and cooking, the sign-in pills go too', () => {
		render(RecipeActions, {
			props: makeProps({ canFavorite: false, loginHref: '/login', cooking: true })
		});
		expect(screen.queryByRole('link')).toBeNull();
	});

	test('both words are always laid out, so the pill keeps one width', () => {
		const { rerender } = render(RecipeActions, { props: makeProps() });
		const cook = screen.getByRole('button', { name: 'Cook' });
		const words = () =>
			[...cook.querySelectorAll('.cook-label > span')].map((el) =>
				el.textContent!.replace(/\s+/g, ' ').trim()
			);
		expect(words()).toEqual(['Cook', 'Done cooking']);
		expect(cook.querySelector('[aria-hidden="true"].invisible')).toHaveTextContent('Done cooking');
		rerender(makeProps({ cooking: true }));
		expect(words()).toEqual(['Cook', 'Done cooking']);
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
		expect(screen.getByText('Your screen may still sleep.')).toHaveClass('text-text-3');
	});

	test('without the API and not cooking, no note', async () => {
		Reflect.deleteProperty(navigator, 'wakeLock');
		render(RecipeActions, { props: makeProps() });
		await tick();
		expect(screen.queryByText('Your screen may still sleep.')).toBeNull();
	});
});
