import { describe, test, expect } from 'vitest';
import { contentDraft, REQUIRED_MESSAGES } from '#lib/recipes/validation.js';
import { render } from 'svelte/server';
import EditPage from './+page.svelte';
import { makeContent } from '#lib/recipes/fixtures.js';

// A submit before hydration, or with JavaScript off, is a plain POST, and the
// reply is server-rendered. Effects never run there, so the returned draft
// must be the initial state, not something applied after mount.
describe('edit page, server rendered', () => {
	test('renders the returned draft in the inputs', () => {
		const data = {
			recipe: {
				slug: 'cookies',
				title: 'Cookies',
				imageUrl: null,
				visibility: 'private',
				editRevision: 3,
				recipesToTags: []
			},
			latestVersion: { versionNumber: 1, commitMessage: 'x', ...makeContent() },
			allTags: []
		};
		const form = {
			error: REQUIRED_MESSAGES.title,
			draft: {
				...contentDraft(data.latestVersion, { editRevision: '3', visibility: 'private', tags: [] }),
				title: 'Biscuits'
			}
		};
		const { body } = render(EditPage, { props: { data, form } as never });
		expect(body).toMatch(/<textarea[^>]*name="title"[^>]*>Biscuits<\/textarea>/);
		// The field's message too: the effect that places it never runs on the server.
		expect(body).toMatch(new RegExp(`<p[^>]*id="title-error"[^>]*>${REQUIRED_MESSAGES.title}</p>`));
		expect(body).toMatch(
			/<textarea[^>]*aria-invalid="true"[^>]*name="title"|name="title"[^>]*aria-invalid="true"/
		);
	});
});
