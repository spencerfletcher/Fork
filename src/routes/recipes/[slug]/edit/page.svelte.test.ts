import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EditPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

function makeData() {
	return {
		recipe: {
			slug: 'cookies',
			title: 'Cookies',
			description: null,
			imageUrl: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null,
			isPublic: false,
			recipesToTags: []
		},
		latestVersion: null,
		allTags: []
	} as never;
}

describe('Edit page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(EditPage, { props: { data: makeData(), form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('shows a metadata error under the info form only', () => {
		render(EditPage, {
			props: { data: makeData(), form: { error: 'Title is required', section: 'meta' } }
		});
		const alerts = screen.getAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Title is required');
		expect(alerts[0].closest('form')).toHaveAttribute('action', '?/saveMeta');
	});

	test('shows a content error under the version form only', () => {
		render(EditPage, {
			props: { data: makeData(), form: { error: 'Each step needs text', section: 'content' } }
		});
		const alerts = screen.getAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Each step needs text');
		expect(alerts[0].closest('form')).toHaveAttribute('action', '?/saveVersion');
	});
});
