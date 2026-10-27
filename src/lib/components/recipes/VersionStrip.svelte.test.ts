import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import VersionStrip from './VersionStrip.svelte';

function makeVersion(n: number, message: string) {
	return {
		id: n,
		versionNumber: n,
		commitMessage: message,
		createdAt: new Date('2026-01-01'),
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
		render(VersionStrip, { props });
		expect(screen.getByText('v2')).toHaveClass('version-current');
		expect(screen.getByText('Added espresso powder')).toBeInTheDocument();
		expect(screen.queryByText('Initial recipe')).toBeNull();
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
		expect(screen.getByText('Initial recipe')).toBeInTheDocument();
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

	test('hides compare links while viewing history', () => {
		render(VersionStrip, { props: { ...props, isViewingHistory: true, currentVersionNumber: 1 } });
		expect(screen.getByText('v1')).toHaveClass('version-current');
		expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
	});
});
