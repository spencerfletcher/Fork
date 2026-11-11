import { describe, expect, test } from 'vitest';
import { COLLECTION_NAME_ERROR, COLLECTION_NAME_MAX, collectionName } from './collections.js';

describe('collectionName', () => {
	test('trims and folds inner runs of space', () => {
		expect(collectionName('  Good   for parties ')).toEqual({ name: 'Good for parties' });
	});

	test('refuses an empty or blank name', () => {
		expect(collectionName('   ')).toEqual({ error: COLLECTION_NAME_ERROR.empty });
	});

	test('takes exactly the maximum and refuses one more, counting characters not code units', () => {
		const at = 'é'.repeat(COLLECTION_NAME_MAX - 1) + '🍝';
		expect(collectionName(at)).toEqual({ name: at });
		expect(collectionName(at + 'x')).toEqual({ error: COLLECTION_NAME_ERROR.long });
	});
});
