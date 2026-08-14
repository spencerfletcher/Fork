import { render, screen } from '@testing-library/svelte';
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
	test('renders every version', () => {
		render(VersionStrip, { props });
		expect(screen.getByText(/v1/)).toBeInTheDocument();
		expect(screen.getByText(/v2/)).toBeInTheDocument();
	});

	test('marks the current version', () => {
		render(VersionStrip, { props });
		expect(screen.getByLabelText(/current version/i)).toHaveTextContent('v2');
	});

	test('offers a compare link for versions after the first', () => {
		render(VersionStrip, { props });
		const link = screen.getByRole('link', { name: /compare/i });
		expect(link).toHaveAttribute('href', '/recipes/classic-cookies-abc123/diff?from=1&to=2');
	});

	test('hides compare links while viewing history', () => {
		render(VersionStrip, { props: { ...props, isViewingHistory: true } });
		expect(screen.queryByRole('link', { name: /compare/i })).not.toBeInTheDocument();
	});
});
