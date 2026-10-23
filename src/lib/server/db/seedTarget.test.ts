import { describe, test, expect } from 'vitest';
import { describeSeedTarget } from './seedTarget';

const LOCAL_DB = 'postgresql://postgres:pw@127.0.0.1:54322/postgres';
const LOCAL_API = 'http://127.0.0.1:54321';
const POOLER_DB =
	'postgresql://postgres.abcdefgh:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
const DIRECT_DB = 'postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres';
const HOSTED_API = 'https://abcdefgh.supabase.co';

describe('describeSeedTarget', () => {
	test('local target with local database and API', () => {
		expect(describeSeedTarget(false, LOCAL_DB, LOCAL_API)).toBe('local database');
	});

	test('local target rejects a hosted database', () => {
		expect(() => describeSeedTarget(false, POOLER_DB, LOCAL_API)).toThrow(/local stack/);
	});

	test('local target rejects hosted Supabase credentials with a local database', () => {
		expect(() => describeSeedTarget(false, LOCAL_DB, HOSTED_API)).toThrow(/local stack/);
	});

	test('hosted target names the project, through the pooler or the direct host', () => {
		expect(describeSeedTarget(true, POOLER_DB, HOSTED_API)).toBe('hosted project abcdefgh');
		expect(describeSeedTarget(true, DIRECT_DB, HOSTED_API)).toBe('hosted project abcdefgh');
	});

	test('hosted target rejects a local database or local API', () => {
		expect(() => describeSeedTarget(true, LOCAL_DB, HOSTED_API)).toThrow(/hosted project/);
		expect(() => describeSeedTarget(true, POOLER_DB, LOCAL_API)).toThrow(/hosted project/);
	});

	test('hosted target rejects credentials from two different projects', () => {
		const other =
			'postgresql://postgres.zzzzzzzz:pw@aws-0-us-west-1.pooler.supabase.com:5432/postgres';
		expect(() => describeSeedTarget(true, other, HOSTED_API)).toThrow(/zzzzzzzz.*abcdefgh/);
	});
});
