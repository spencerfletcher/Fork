import { describe, test, expect } from 'vitest';
import { NOTIFICATION_KINDS, mutedKinds } from './notifications.js';

describe('mutedKinds', () => {
	test("keeps the list's kinds in the list's order and ignores anything else", () => {
		const [first, second] = NOTIFICATION_KINDS;
		expect(mutedKinds([second, 'retired-kind', first, second])).toEqual([first, second]);
	});

	test('nothing stored is nothing muted', () => {
		expect(mutedKinds([])).toEqual([]);
	});
});
