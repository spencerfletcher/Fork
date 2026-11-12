import { describe, test, expect } from 'vitest';
import {
	PUBLIC_SEED_PASSWORD,
	describeDbTarget,
	loadsVaried,
	printedPassword,
	seedPassword
} from './target';

const LOCAL_DB = 'postgresql://postgres:pw@127.0.0.1:54322/postgres';
const LOCAL_API = 'http://127.0.0.1:54321';
const E2E_DB = 'postgresql://postgres:pw@127.0.0.1:54322/fork_e2e';
const POOLER_DB =
	'postgresql://postgres.abcdefgh:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
const DIRECT_DB = 'postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres';
const HOSTED_API = 'https://abcdefgh.supabase.co';
const REF = 'abcdefgh';

describe('describeDbTarget', () => {
	test('local target with local database and API', () => {
		expect(describeDbTarget('local', LOCAL_DB, LOCAL_API, undefined)).toBe('local database');
	});

	test('local target rejects a hosted database', () => {
		expect(() => describeDbTarget('local', POOLER_DB, LOCAL_API, REF)).toThrow(/local stack/);
	});

	test('local target rejects hosted Supabase credentials with a local database', () => {
		expect(() => describeDbTarget('local', LOCAL_DB, HOSTED_API, REF)).toThrow(/local stack/);
	});

	test('hosted target names the project, through the pooler or the direct host', () => {
		expect(describeDbTarget('prod', POOLER_DB, HOSTED_API, REF)).toBe('hosted project abcdefgh');
		expect(describeDbTarget('prod', DIRECT_DB, HOSTED_API, REF)).toBe('hosted project abcdefgh');
	});

	test('hosted target requires the expected project ref to be set', () => {
		expect(() => describeDbTarget('prod', POOLER_DB, HOSTED_API, undefined)).toThrow(
			/SUPABASE_PROJECT_ID/
		);
	});

	test('hosted target rejects a local database or local API', () => {
		expect(() => describeDbTarget('prod', LOCAL_DB, HOSTED_API, REF)).toThrow(/hosted project/);
		expect(() => describeDbTarget('prod', POOLER_DB, LOCAL_API, REF)).toThrow(/hosted project/);
	});

	test('hosted target rejects credentials from two different projects', () => {
		const other =
			'postgresql://postgres.zzzzzzzz:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
		expect(() => describeDbTarget('prod', other, HOSTED_API, REF)).toThrow(/zzzzzzzz/);
	});

	test('hosted target rejects a matching database and API pair for the wrong project', () => {
		const otherDb =
			'postgresql://postgres.zzzzzzzz:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
		const otherApi = 'https://zzzzzzzz.supabase.co';
		expect(() => describeDbTarget('prod', otherDb, otherApi, REF)).toThrow(/zzzzzzzz.*abcdefgh/);
	});

	test('e2e target accepts the local fork_e2e database', () => {
		expect(describeDbTarget('e2e', E2E_DB, LOCAL_API, undefined)).toBe('e2e database fork_e2e');
	});

	test('e2e target refuses any other database, so it can never reset the dev one', () => {
		expect(() => describeDbTarget('e2e', LOCAL_DB, LOCAL_API, undefined)).toThrow(/fork_e2e/);
	});

	test('e2e target refuses a hosted database or API', () => {
		expect(() => describeDbTarget('e2e', POOLER_DB, LOCAL_API, REF)).toThrow(/local stack/);
		expect(() => describeDbTarget('e2e', E2E_DB, HOSTED_API, REF)).toThrow(/local stack/);
	});
});

describe('seedPassword', () => {
	test('the local stack falls back to the public password, or takes the one set', () => {
		expect(seedPassword('local', undefined)).toBe(PUBLIC_SEED_PASSWORD);
		expect(seedPassword('e2e', undefined)).toBe(PUBLIC_SEED_PASSWORD);
		expect(seedPassword('local', 'own-pass-1')).toBe('own-pass-1');
	});

	test('a hosted target takes only a password set in the environment', () => {
		expect(seedPassword('prod', 'own-pass-1')).toBe('own-pass-1');
	});

	test('a hosted target refuses an unset, empty or public password, naming the variable not a value', () => {
		for (const typed of [undefined, '', PUBLIC_SEED_PASSWORD]) {
			expect(() => seedPassword('prod', typed)).toThrow(/SEED_USER_PASSWORD/);
		}
		expect(() => seedPassword('prod', PUBLIC_SEED_PASSWORD)).not.toThrow(
			new RegExp(PUBLIC_SEED_PASSWORD)
		);
	});

	test('the password is printed on the local stack only', () => {
		expect(printedPassword('local', 'own-pass-1')).toBe('own-pass-1');
		expect(printedPassword('e2e', 'own-pass-1')).toBe('own-pass-1');
		expect(printedPassword('prod', 'own-pass-1')).toBe('from SEED_USER_PASSWORD');
	});
});

describe('loadsVaried', () => {
	test('local and the hosted project load the varied set; e2e keeps the base alone', () => {
		expect(loadsVaried('local')).toBe(true);
		expect(loadsVaried('prod')).toBe(true);
		expect(loadsVaried('e2e')).toBe(false);
	});
});
