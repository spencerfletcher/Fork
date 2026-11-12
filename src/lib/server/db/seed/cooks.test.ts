import { describe, test, expect } from 'vitest';
import { VARIED_COOKS, isSeededEmail, seededEmail } from './cooks';

describe('isSeededEmail', () => {
	test('every invented cook’s address, in any case', () => {
		for (const cook of VARIED_COOKS)
			expect(isSeededEmail(seededEmail(cook).toUpperCase())).toBe(true);
	});

	test('nobody else: a real address, an e2e sign-up, a stranger on the seed domain', () => {
		expect(isSeededEmail('spencer@fork.dev')).toBe(false);
		expect(isSeededEmail('confirm-abc@example.com')).toBe(false);
		expect(isSeededEmail(`${VARIED_COOKS[0]}@example.com`)).toBe(false);
		expect(isSeededEmail(seededEmail(VARIED_COOKS[0]).replace(VARIED_COOKS[0], 'someone'))).toBe(
			false
		);
		expect(isSeededEmail(undefined)).toBe(false);
	});
});
