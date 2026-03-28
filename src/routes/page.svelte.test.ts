import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	test('renders the site heading', () => {
		render(Page, { props: { data: { recipes: [], user: null, profile: null } } });
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});
