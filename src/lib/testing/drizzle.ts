import { vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

/** A query fragment as the SQL text and params Postgres would get, to compare or search. */
export const sqlOf = (q: SQL) => new PgDialect().sqlToQuery(q);

/**
 * A Drizzle-shaped query builder for tests. Every builder method returns the
 * chain, awaiting it resolves `rows`, and `.returning()` resolves `rows` too.
 */
export function chain(rows: unknown = undefined) {
	const p = Promise.resolve(rows);
	const c: Record<string, unknown> = {
		then: p.then.bind(p),
		catch: p.catch.bind(p),
		finally: p.finally.bind(p),
		returning: vi.fn().mockReturnValue(p)
	};
	const methods = [
		'values',
		'set',
		'from',
		'where',
		'orderBy',
		'innerJoin',
		'leftJoin',
		'groupBy',
		'limit',
		'onConflictDoNothing',
		'for'
	];
	for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
	return c as Record<string, ReturnType<typeof vi.fn>> & PromiseLike<unknown>;
}

/**
 * The db the recipe list pages read (select, selectDistinct, the recipes
 * findMany, and $count for their totals, 0 unless set), each a vi.fn.
 * vi.mock factories are hoisted above imports, so
 * build it inside vi.hoisted:
 *
 *   const db = await vi.hoisted(async () => (await import('#lib/testing/drizzle.js')).mockDb());
 *   vi.mock('#lib/server/db/index.js', () => ({ db }));
 */
export function mockDb() {
	return {
		select: vi.fn(),
		selectDistinct: vi.fn(),
		$count: vi.fn().mockResolvedValue(0),
		query: { recipes: { findMany: vi.fn() } }
	};
}
