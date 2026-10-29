import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import VersionBar from './VersionBar.svelte';
import type { ComponentProps } from 'svelte';

vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

type Props = ComponentProps<typeof VersionBar>;

function makeVersion(versionNumber: number, commitMessage: string) {
	return { id: versionNumber, versionNumber, commitMessage };
}

const THREE = [
	makeVersion(3, 'Chill the dough'),
	makeVersion(2, 'Add espresso powder'),
	makeVersion(1, 'Initial recipe')
];

function renderBar(overrides: Partial<Props> = {}) {
	return render(VersionBar, {
		props: {
			recipe: { slug: 'my-fork' },
			currentVersion: THREE[0],
			versions: THREE,
			isViewingHistory: false,
			...overrides
		}
	});
}

describe('VersionBar', () => {
	test('a recipe with one version has no bar at all', () => {
		const { container } = renderBar({
			currentVersion: THREE[2],
			versions: [THREE[2]]
		});
		expect(container.querySelector('.version-bar')).toBeNull();
	});

	test('the latest version, closed: number, message and the toggle; the compare waits for open', () => {
		const { container } = renderBar();
		expect(container.querySelector('.version-bar')).toHaveAttribute(
			'aria-label',
			'Version history'
		);
		const current = container.querySelector('.version-bar .current')!;
		expect(current.querySelector('.version-number')).toHaveTextContent('v3');
		expect(current.querySelector('.version-number .sr-only')).toHaveTextContent(
			'Version 3, the latest'
		);
		expect(current.querySelector('.message')).toHaveTextContent('Chill the dough');
		expect(current.querySelector('.message')).toHaveClass('clamped');
		const toggle = screen.getByRole('button', { name: '3 versions' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(toggle).toHaveAttribute('aria-controls', 'version-history');
		expect(screen.queryByRole('link', { name: 'Compare with v2' })).toBeNull();
		expect(screen.getByText('Add espresso powder')).not.toBeVisible();
		expect(screen.queryByText(/older version/i)).toBeNull();
	});

	test('opening lists the other versions as row links, each comparing with this one, and unclamps the message', async () => {
		const { container } = renderBar();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(screen.getByRole('button', { name: '3 versions' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect(container.querySelector('.version-bar .current .message')).not.toHaveClass('clamped');
		// Open, the current line compares with the one before, now one row below.
		expect(screen.getByRole('link', { name: 'Compare with v2' })).toHaveAttribute(
			'href',
			'/recipes/my-fork/diff?from=2&to=3'
		);
		expect(container.querySelectorAll('#version-history li')).toHaveLength(2);
		expect(screen.getByRole('link', { name: 'v2 Add espresso powder' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=2'
		);
		expect(screen.getByRole('link', { name: 'v1 Initial recipe' })).toHaveAttribute(
			'href',
			'/recipes/my-fork?version=1'
		);
		const compares = screen.getAllByRole('link', { name: 'Compare with v3' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=3'
		]);
	});

	test('Escape closes the list and puts focus back on the toggle, but only from inside the bar', async () => {
		renderBar();
		const toggle = screen.getByRole('button', { name: '3 versions' });
		await fireEvent.click(toggle);
		expect(screen.getByText('Initial recipe')).toBeVisible();
		// Focus elsewhere on the page: Escape is not the bar's to take.
		const outside = document.createElement('button');
		document.body.append(outside);
		outside.focus();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByText('Initial recipe')).toBeVisible();
		expect(outside).toHaveFocus();
		outside.remove();
		toggle.focus();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.getByText('Initial recipe')).not.toBeVisible();
		expect(toggle).toHaveFocus();
	});

	test('an older version says so, offers the way back, and compares with the latest', async () => {
		const { container } = renderBar({ currentVersion: THREE[1], isViewingHistory: true });
		const current = container.querySelector('.version-bar .current')!;
		expect(current.querySelector('.version-number')).toHaveTextContent('v2');
		expect(current.querySelector('.version-number .sr-only')).toHaveTextContent(
			'Version 2 of 3, an older version'
		);
		expect(current).toHaveTextContent('Older version');
		expect(screen.getByRole('link', { name: 'Back to v3' })).toHaveAttribute(
			'href',
			'/recipes/my-fork'
		);
		// Each control carries its own separator, so a wrapped line never ends in one.
		for (const item of current.querySelectorAll('.controls .item')) {
			expect(item.textContent!.trim()).not.toMatch(/·$/);
		}
		expect(screen.queryByRole('link', { name: 'Compare with v3' })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: '3 versions' }));
		expect(screen.getAllByRole('link', { name: 'Compare with v3' })[0]).toHaveAttribute(
			'href',
			'/recipes/my-fork/diff?from=2&to=3'
		);
		expect(container.querySelectorAll('#version-history li')).toHaveLength(2);
		const compares = screen.getAllByRole('link', { name: 'Compare with v2' });
		expect(compares.map((a) => a.getAttribute('href'))).toEqual([
			'/recipes/my-fork/diff?from=2&to=3',
			'/recipes/my-fork/diff?from=1&to=2'
		]);
	});
});
