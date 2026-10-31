import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { loadEnv, targetFromEnv } from './env';

const KEYS = ['DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'DB_TARGET'];

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

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
	// Reads the committed .env.e2e from the repo root, the file the suite really
	// uses. .env.local is git-ignored (absent in CI), so it is stood in for here:
	// the local stack's URL and key, and the dev database .env.e2e must override.
	test("'e2e' takes the stack's keys from .env.local and the fork_e2e database from .env.e2e", () => {
		for (const key of KEYS) vi.stubEnv(key, undefined);
		const envLocal = join(mkdtempSync(join(tmpdir(), 'env-')), '.env.local');
		writeFileSync(
			envLocal,
			[
				'PUBLIC_SUPABASE_URL=http://127.0.0.1:54321',
				'SUPABASE_SECRET_KEY=key-from-env-local',
				'DATABASE_URL=postgresql://postgres:pw@127.0.0.1:54322/postgres'
			].join('\n')
		);
		const loadEnvFile = process.loadEnvFile.bind(process);
		vi.spyOn(process, 'loadEnvFile').mockImplementation((path) =>
			loadEnvFile(path === '.env.local' ? envLocal : path)
		);
		const env = loadEnv('e2e');
		expect(env.SUPABASE_SECRET_KEY).toBe('key-from-env-local');
		expect(new URL(env.DATABASE_URL).pathname).toBe('/fork_e2e');
		expect(new URL(env.SUPABASE_URL).hostname).toBe('127.0.0.1');
		expect(env.description).toBe('e2e database fork_e2e');
	});

	// Committed, so a secret scanner reads it: the stack's URL and keys stay in .env.local.
	test('the committed .env.e2e sets no Supabase URL or key', () => {
		const lines = readFileSync('.env.e2e', 'utf8').split('\n');
		expect(lines.filter((line) => /^(PUBLIC_)?SUPABASE_/.test(line))).toEqual([]);
	});
});
