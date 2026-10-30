import { describe, test, expect } from 'vitest';
import { render } from 'svelte/server';
import NewPage from './+page.svelte';

// See edit/page.ssr.test.ts: the returned draft must survive a server render.
describe('new page, server rendered', () => {
	test('renders the returned draft in the inputs', () => {
		const form = {
			error: 'Title is required',
			draft: {
				title: 'Soup',
				description: '',
				servings: '',
				prepTimeMinutes: '-5',
				cookTimeMinutes: '',
				ingredients: '',
				steps: '',
				commitMessage: '',
				editRevision: '',
				isPublic: true,
				tags: [],
				hadPhoto: false,
				removeImage: false
			}
		};
		const { body } = render(NewPage, { props: { data: { allTags: [] }, form } as never });
		expect(body).toMatch(/<textarea[^>]*name="title"[^>]*>Soup<\/textarea>/);
		expect(body).toContain('value="-5"');
	});
});
