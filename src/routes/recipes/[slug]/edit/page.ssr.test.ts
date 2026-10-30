import { describe, test, expect } from 'vitest';
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
				isPublic: false,
				editRevision: 3,
				recipesToTags: []
			},
			latestVersion: { versionNumber: 1, commitMessage: 'x', ...makeContent() },
			allTags: []
		};
		const form = {
			error: 'Title is required',
			draft: {
				title: 'Biscuits',
				description: '',
				servings: '4',
				prepTimeMinutes: '10',
				cookTimeMinutes: '20',
				ingredients: '1 cup flour',
				steps: 'Mix.',
				commitMessage: '',
				editRevision: '3',
				isPublic: false,
				tags: [],
				hadPhoto: false,
				removeImage: false
			}
		};
		const { body } = render(EditPage, { props: { data, form } as never });
		expect(body).toMatch(/<textarea[^>]*name="title"[^>]*>Biscuits<\/textarea>/);
	});
});
