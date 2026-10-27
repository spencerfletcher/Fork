import { vi } from 'vitest';

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
		'onConflictDoNothing'
	];
	for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
	return c as Record<string, ReturnType<typeof vi.fn>> & PromiseLike<unknown>;
}
