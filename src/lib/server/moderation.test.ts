import { describe, expect, test, vi } from 'vitest';

const env = vi.hoisted(() => ({ MODERATOR_IDS: ' mod-1, mod-2 ,,' }));
vi.mock('$app/env/private', () => env);
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));

import { isModerator } from './moderation.js';

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
