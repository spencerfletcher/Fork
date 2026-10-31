import { describe, test, expect } from 'vitest';
import {
	USERNAME_MAX,
	USERNAME_MESSAGE,
	USERNAME_MIN,
	USERNAME_PATTERN,
	normalizeUsername,
	suggestUsername,
	validUsername
} from './rules.js';

// How a browser reads the pattern attribute: anchored, with the v flag.
const asBrowser = new RegExp(`^(?:${USERNAME_PATTERN})$`, 'v');
const of = (n: number) => 'a'.repeat(n);

describe('username rule', () => {
	test.each([
		[of(USERNAME_MIN), true],
		[of(USERNAME_MAX), true],
		[of(USERNAME_MIN - 1), false],
		[of(USERNAME_MAX + 1), false],
		['jane_doe-1', true],
		['Jane_Doe', true],
		['jane doe', false],
		['jane.doe', false],
		['jané', false]
	])('%s: %s, the same in the browser and on the server', (raw, ok) => {
		expect(asBrowser.test(raw)).toBe(ok);
		expect(validUsername(normalizeUsername(raw))).toBe(ok);
	});

	test('the server stores the handle trimmed and lowercased', () => {
		expect(normalizeUsername('  Jane_Doe ')).toBe('jane_doe');
	});

	test('the message names the bounds', () => {
		expect(USERNAME_MESSAGE).toContain(`${USERNAME_MIN} to ${USERNAME_MAX} characters`);
	});
});

describe('suggestUsername', () => {
	test('the email prefix, lowercased, with disallowed characters dropped', () => {
		expect(suggestUsername('Jane.Doe+cakes@example.com')).toBe('janedoecakes');
	});

	test('is capped at the maximum, so a long prefix still passes the rule', () => {
		const suggestion = suggestUsername(`${of(USERNAME_MAX + 10)}@example.com`);
		expect(suggestion).toHaveLength(USERNAME_MAX);
		expect(validUsername(suggestion)).toBe(true);
	});
});
