import { afterEach, describe, expect, test, vi } from 'vitest';
import { loadEnv, targetFromEnv } from './env';

const KEYS = ['DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'DB_TARGET'];

afterEach(() => vi.unstubAllEnvs());

describe('targetFromEnv', () => {
	test.each(['local', 'e2e', 'prod'] as const)('DB_TARGET=%s selects %s', (target) => {
		vi.stubEnv('DB_TARGET', target);
		expect(targetFromEnv()).toBe(target);
	});

	test('unset is the local stack', () => {
		vi.stubEnv('DB_TARGET', undefined);
		expect(targetFromEnv()).toBe('local');
	});
});

describe('loadEnv', () => {
	// Reads the committed .env.e2e from the repo root, the file the suite really uses.
	test("'e2e' loads .env.e2e and points at the local fork_e2e database", () => {
		for (const key of KEYS) vi.stubEnv(key, undefined);
		const env = loadEnv('e2e');
		expect(new URL(env.DATABASE_URL).pathname).toBe('/fork_e2e');
		expect(new URL(env.SUPABASE_URL).hostname).toBe('127.0.0.1');
		expect(env.description).toBe('e2e database fork_e2e');
	});
});
