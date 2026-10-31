import { describe, test, expect } from 'vitest';
import { desc } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { recipes } from './db/schema.js';
import { parseFilters, textSearch } from './recipeSearch.js';

const url = (search: string) => new URL(`http://localhost/search${search}`);

describe('parseFilters', () => {
	test('trims the query and splits the tags, dropping empty slugs', () => {
		expect(parseFilters(url('?q=%20cookie%20&tags=dessert,,quick'))).toEqual({
			searchQuery: 'cookie',
			tagSlugs: ['dessert', 'quick']
		});
	});

	test('no parameters is no query and no tags', () => {
		expect(parseFilters(url(''))).toEqual({ searchQuery: '', tagSlugs: [] });
		expect(parseFilters(url('?q=%20%20'))).toEqual({ searchQuery: '', tagSlugs: [] });
	});
});

describe('textSearch', () => {
	test('without a query it matches everything, newest change first', () => {
		expect(textSearch('')).toEqual({ where: undefined, orderBy: [desc(recipes.updatedAt)] });
	});

	test('matches the recipe text or an ingredient name, ranked, newest breaking ties', () => {
		const { where, orderBy } = textSearch('cookie');
		if (!where) throw new Error('expected a condition');
		const { sql, params } = new PgDialect().sqlToQuery(where);
		expect(sql).toContain('"fts" @@ websearch_to_tsquery');
		expect(sql).toContain("ing->>'name'");
		expect(params).toContain('cookie');
		expect(orderBy).toHaveLength(2);
		expect(new PgDialect().sqlToQuery(orderBy[0]).sql).toContain('ts_rank');
		expect(orderBy[1]).toEqual(desc(recipes.updatedAt));
	});
});
