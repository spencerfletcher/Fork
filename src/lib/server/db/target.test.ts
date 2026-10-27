import { describe, test, expect } from 'vitest';
import { describeDbTarget } from './target';

const LOCAL_DB = 'postgresql://postgres:pw@127.0.0.1:54322/postgres';
const LOCAL_API = 'http://127.0.0.1:54321';
const POOLER_DB =
	'postgresql://postgres.abcdefgh:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
const DIRECT_DB = 'postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres';
const HOSTED_API = 'https://abcdefgh.supabase.co';
const REF = 'abcdefgh';

describe('describeDbTarget', () => {
	test('local target with local database and API', () => {
		expect(describeDbTarget(false, LOCAL_DB, LOCAL_API, undefined)).toBe('local database');
	});

	test('local target rejects a hosted database', () => {
		expect(() => describeDbTarget(false, POOLER_DB, LOCAL_API, REF)).toThrow(/local stack/);
	});

	test('local target rejects hosted Supabase credentials with a local database', () => {
		expect(() => describeDbTarget(false, LOCAL_DB, HOSTED_API, REF)).toThrow(/local stack/);
	});

	test('hosted target names the project, through the pooler or the direct host', () => {
		expect(describeDbTarget(true, POOLER_DB, HOSTED_API, REF)).toBe('hosted project abcdefgh');
		expect(describeDbTarget(true, DIRECT_DB, HOSTED_API, REF)).toBe('hosted project abcdefgh');
	});

	test('hosted target requires the expected project ref to be set', () => {
		expect(() => describeDbTarget(true, POOLER_DB, HOSTED_API, undefined)).toThrow(
			/SUPABASE_PROJECT_ID/
		);
	});

	test('hosted target rejects a local database or local API', () => {
		expect(() => describeDbTarget(true, LOCAL_DB, HOSTED_API, REF)).toThrow(/hosted project/);
		expect(() => describeDbTarget(true, POOLER_DB, LOCAL_API, REF)).toThrow(/hosted project/);
	});

	test('hosted target rejects credentials from two different projects', () => {
		const other =
			'postgresql://postgres.zzzzzzzz:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
		expect(() => describeDbTarget(true, other, HOSTED_API, REF)).toThrow(/zzzzzzzz/);
	});

	test('hosted target rejects a matching database and API pair for the wrong project', () => {
		const otherDb =
			'postgresql://postgres.zzzzzzzz:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
		const otherApi = 'https://zzzzzzzz.supabase.co';
		expect(() => describeDbTarget(true, otherDb, otherApi, REF)).toThrow(/zzzzzzzz.*abcdefgh/);
	});
});
