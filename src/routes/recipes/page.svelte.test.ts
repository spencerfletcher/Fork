import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';

// The route redirects (page.server.test.ts); the page itself has nothing to show.
describe('/recipes page', () => {
	test('renders nothing', () => {
		const { container } = render(Page);
		expect(container.textContent?.trim()).toBe('');
	});
});
