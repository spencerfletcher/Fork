import { describe, test, expect } from 'vitest';
import { factsSummary } from './factsSummary.js';
import { draftOf, type RecipeDraft } from './validation.js';
import { AUDIENCE_LABEL } from '#lib/audience.js';
import { formatDuration, TIME_FIELDS } from './times.js';

const draft = (fields: Partial<RecipeDraft>): RecipeDraft => ({
	...draftOf(new FormData()),
	...fields
});

describe('factsSummary', () => {
	test('nothing set: the audience, what is missing, and Add details', () => {
		const s = factsSummary(draft({ visibility: 'friends' }), false);
		expect(s.facts).toEqual([AUDIENCE_LABEL.friends, 'No photo, times or tags yet']);
		expect(s.action).toBe('Add details');
	});

	test('the yield reads as the author entered it, then the audience', () => {
		const s = factsSummary(draft({ makes: ' 36 cookies ', visibility: 'public' }), false);
		expect(s.facts).toEqual(['Makes 36 cookies', AUDIENCE_LABEL.public]);
		expect(s.action).toBe('Edit details');
	});

	test('serves and makes both, then times as the page prints them, tags, photo and source', () => {
		const s = factsSummary(
			draft({
				servings: '36',
				makes: '3 dozen',
				prepTimeMinutes: '15',
				restTimeMinutes: '2 h',
				tags: ['Dessert', 'Baking'],
				sourceName: "Grandma Ruth's card",
				visibility: 'private'
			}),
			true
		);
		expect(s.facts).toEqual([
			'Serves 36',
			'Makes 3 dozen',
			AUDIENCE_LABEL.private,
			`${formatDuration(15)} ${TIME_FIELDS.prepTimeMinutes.word}`,
			`${formatDuration(120)} ${TIME_FIELDS.restTimeMinutes.word}`,
			'2 tags',
			'Photo',
			"Grandma Ruth's card"
		]);
	});

	test('a time the field refuses is left out; the field says why', () => {
		const s = factsSummary(draft({ cookTimeMinutes: 'a while' }), false);
		expect(s.facts).toEqual([AUDIENCE_LABEL.private, 'No photo, times or tags yet']);
	});

	test('a source link alone reads as its host', () => {
		const s = factsSummary(draft({ sourceUrl: 'www.example.com/pie' }), false);
		expect(s.facts).toContain('example.com');
	});

	test('one tag is singular', () => {
		expect(factsSummary(draft({ tags: ['Dessert'] }), false).facts).toContain('1 tag');
	});
});
