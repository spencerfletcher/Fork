import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import VersionStrip from './VersionStrip.svelte';

vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

function makeVersion(n: number, message: string) {
	return {
		id: n,
		versionNumber: n,
		commitMessage: message,
		createdAt: new Date(2026, 0, 1),
		creator: { id: 'u1', username: 'spencerfletcher' }
	};
}

const props = {
	versions: [makeVersion(1, 'Initial recipe'), makeVersion(2, 'Added espresso powder')],
	currentVersionNumber: 2,
	recipeSlug: 'classic-cookies-abc123',
	isViewingHistory: false
};

describe('VersionStrip', () => {
	test('shows the current version and its message without expanding', () => {
		const { container } = render(VersionStrip, { props });
		expect(container.querySelector('.version-current')).toHaveTextContent('v2');
		expect(container.querySelector('.version-head > .version-message')).toHaveTextContent(
			'Added espresso powder'
		);
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		// The toggle always controls a real element.
		expect(document.getElementById('version-history')).not.toBeNull();
	});

	test('offers a compare with the previous version', () => {
		render(VersionStrip, { props });
		expect(screen.getByRole('link', { name: 'Compare with v1' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies-abc123/diff?from=1&to=2'
		);
	});

	test('expands to every version with its own links', async () => {
		render(VersionStrip, { props });
		await fireEvent.click(screen.getByRole('button', { name: '2 versions' }));
		expect(screen.getByRole('link', { name: 'v1' })).toHaveAttribute(
			'href',
			'/recipes/classic-cookies-abc123?version=1'
		);
		expect(screen.getByText('Initial recipe')).toBeVisible();
		expect(screen.getByRole('link', { name: 'v2' })).toHaveAttribute('aria-current', 'true');
	});

	test('a single version has nothing to expand and nothing to compare', () => {
		render(VersionStrip, {
			props: { ...props, versions: [makeVersion(1, 'Initial recipe')], currentVersionNumber: 1 }
		});
		expect(screen.getByText('1 version')).toBeInTheDocument();
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
	});

	test('Escape closes the panel and returns focus to the toggle', async () => {
		render(VersionStrip, { props });
		const toggle = screen.getByRole('button', { name: '2 versions' });
		await fireEvent.click(toggle);
		expect(screen.getByText('Initial recipe')).toBeVisible();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		expect(toggle).toHaveFocus();
	});

	test('a click outside the strip closes the panel', async () => {
		render(VersionStrip, { props });
		await fireEvent.click(screen.getByRole('button', { name: '2 versions' }));
		await fireEvent.click(document.body);
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
	});

	test('hides compare links while viewing history', () => {
		const { container } = render(VersionStrip, {
			props: { ...props, isViewingHistory: true, currentVersionNumber: 1 }
		});
		expect(container.querySelector('.version-current')).toHaveTextContent('v1');
		expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
	});

	test('is one card row: chip and message, a byline, then history, forks and compare', () => {
		const { container } = render(VersionStrip, { props: { ...props, forkCount: 1 } });
		const card = container.querySelector('.version-card')!;
		expect(card.querySelector('.version-head .version-current')).toHaveTextContent('v2');
		expect(card.querySelector('.version-head .version-message')).toHaveTextContent(
			'Added espresso powder'
		);
		expect(card.querySelector('.version-by')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'@spencerfletcher · 1 Jan 2026'
		);
		const foot = card.querySelector('.version-foot')!;
		expect(foot.querySelector('.version-toggle')).toHaveTextContent('2 versions');
		expect(foot.querySelector('.version-forks')).toHaveTextContent('1 fork');
		expect(foot.querySelector('.version-compare')).toHaveTextContent('Compare with v1');
	});

	test('counts the forks beside the versions, and not when there are none', () => {
		const { container, unmount } = render(VersionStrip, { props: { ...props, forkCount: 1 } });
		expect(container.querySelector('.version-forks')).toHaveTextContent('1 fork');
		unmount();
		const second = render(VersionStrip, { props: { ...props, forkCount: 0 } });
		expect(second.container.querySelector('.version-forks')).toBeNull();
	});
});
