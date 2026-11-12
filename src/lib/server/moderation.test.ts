import { describe, expect, test, vi } from 'vitest';

const env = vi.hoisted(() => ({ MODERATOR_IDS: ' mod-1, mod-2 ,,' }));
vi.mock('$app/env/private', () => env);
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));

import { contactOf, isModerator, withContact } from './moderation.js';

describe('isModerator', () => {
	test('each id in MODERATOR_IDS, comma-separated, spaces trimmed', () => {
		expect(isModerator({ id: 'mod-1' })).toBe(true);
		expect(isModerator({ id: 'mod-2' })).toBe(true);
	});

	test('anyone else, signed out, or an empty entry is no moderator', () => {
		expect(isModerator({ id: 'cook' })).toBe(false);
		expect(isModerator({ id: '' })).toBe(false);
		expect(isModerator(null)).toBe(false);
		expect(isModerator(undefined)).toBe(false);
	});

	test('empty or unset means nobody', () => {
		for (const value of ['', undefined]) {
			env.MODERATOR_IDS = value as unknown as string;
			expect(isModerator({ id: 'mod-1' })).toBe(false);
		}
		env.MODERATOR_IDS = 'mod-1';
	});
});

describe("a link report's contact, written into its reason and read back", () => {
	test('reads back the address and the text as written, line breaks and all', () => {
		const text = 'My photo.\n\nPlease take it down.';
		expect(contactOf(withContact('me@example.com', text))).toEqual({
			contact: 'me@example.com',
			text
		});
	});

	test('a reason with no contact line, as the feed files them, has no contact', () => {
		expect(contactOf('Spam')).toEqual({ contact: null, text: 'Spam' });
	});
});
