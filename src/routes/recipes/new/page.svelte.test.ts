import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NewPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const data = { allTags: [] } as never;

describe('New recipe page validation errors', () => {
	test('shows no alert without a failed action', () => {
		render(NewPage, { props: { data, form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('shows the returned error', () => {
		render(NewPage, { props: { data, form: { error: 'Title is required' } } });
		expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
	});
});
