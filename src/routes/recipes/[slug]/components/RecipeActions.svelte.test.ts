import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import RecipeActions from './RecipeActions.svelte';

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
		...overrides
	};
}

// ─── Save button ──────────────────────────────────────────────────────────────

describe('RecipeActions save button', () => {
	test('reflects the initial favourite state', () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: true }) });
		// The visible word is the accessible name: no aria-label saying something else.
		expect(screen.getByRole('button', { name: 'Favorited' })).not.toHaveAttribute('aria-label');
	});

	test('is a toggle button: pressed while favourited, and flips as it submits', async () => {
		render(RecipeActions, { props: makeProps({ initialFavorited: false }) });
		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		await playBack('?/toggleFavorite', { type: 'success' });
		expect(screen.getByRole('button', { name: 'Favorited' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('the star is decoration: the word is the name', () => {
		render(RecipeActions, { props: makeProps() });
		const star = screen.getByRole('button', { name: 'Favorite' }).querySelector('svg')!;
		expect(star).toHaveAttribute('aria-hidden', 'true');
	});

	test('follows the prop when the page moves to a recipe with a different state', async () => {
		// Navigating from one recipe to another (e.g. a fork's "Forked from" link)
		// reuses this component, so only the prop changes.
		const { rerender } = render(RecipeActions, { props: makeProps({ initialFavorited: true }) });

		await rerender(
			makeProps({ recipe: { slug: 'original', title: 'Original' }, initialFavorited: false })
		);

		expect(screen.getByRole('button', { name: 'Favorite' })).toHaveTextContent('Favorite');
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

	test('logged out on an older version, nothing is rendered', () => {
		const { container } = render(RecipeActions, {
			props: makeProps({ canFavorite: false, isViewingHistory: true, loginHref: '/login' })
		});
		expect(container.querySelector('.actions')).toBeNull();
	});

	test('the owner gets Edit in marigold, first, since Fork is not offered', () => {
		render(RecipeActions, { props: makeProps({ isOwner: true }) });
		const edit = screen.getByRole('link', { name: /edit recipe/i });
		expect(edit).toHaveClass('btn-primary');
		const favorite = screen.getByRole('button', { name: /favorite/i });
		expect(edit.compareDocumentPosition(favorite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
