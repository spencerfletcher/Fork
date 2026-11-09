import { describe, test, expect } from 'vitest';
import { AUDIENCE_LABEL } from './audience';
import { VISIBILITIES } from '#lib/recipes/validation.js';
import { LOG_AUDIENCES } from '#lib/server/db/schema.js';

describe('AUDIENCE_LABEL', () => {
	test('names every recipe visibility, and so every Journal audience', () => {
		expect(Object.keys(AUDIENCE_LABEL).sort()).toEqual([...VISIBILITIES].sort());
		for (const audience of LOG_AUDIENCES) expect(AUDIENCE_LABEL[audience]).toBeTruthy();
	});
});
