import { describe, test, expect } from 'vitest';
import { contentDraft, REQUIRED_MESSAGES } from '#lib/recipes/validation.js';
import { render } from 'svelte/server';
import NewPage from './+page.svelte';

// See edit/page.ssr.test.ts: the returned draft must survive a server render.
describe('new page, server rendered', () => {
	test('renders the returned draft in the inputs', () => {
		const form = {
			error: REQUIRED_MESSAGES.title,
			draft: {
				...contentDraft(null, { editRevision: '', visibility: 'private', tags: [] }),
				title: 'Soup',
				prepTimeMinutes: '-5'
			}
		};
		const { body } = render(NewPage, { props: { data: { allTags: [] }, form } as never });
		expect(body).toMatch(/<textarea[^>]*name="title"[^>]*>Soup<\/textarea>/);
		expect(body).toContain('value="-5"');
		// The field's message too: the effect that places it never runs on the server.
		expect(body).toMatch(new RegExp(`<p[^>]*id="title-error"[^>]*>${REQUIRED_MESSAGES.title}</p>`));
		expect(body).toMatch(
			/<textarea[^>]*aria-invalid="true"[^>]*name="title"|name="title"[^>]*aria-invalid="true"/
		);
	});
});
