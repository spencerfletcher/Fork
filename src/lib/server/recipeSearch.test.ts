import { describe, test, expect } from 'vitest';
import { mapColumnsInSQLToAlias } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
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
	test('without a query it matches everything and ranks nothing (browse order)', () => {
		expect(textSearch('')).toEqual({ where: undefined, rank: [] });
	});

	test('matches on the title or any version, ranked by tier, then saves', () => {
		const { where, rank } = textSearch('cookie');
		if (!where) throw new Error('expected a condition');
		const { sql, params } = new PgDialect().sqlToQuery(where);
		expect(sql).toContain('websearch_to_tsquery');
		expect(sql).toContain('recipe_version_doc(');
		expect(sql).toContain('recipe_ingredient_names(');
		expect(params).toContain('cookie');
		expect(rank).toHaveLength(2);
		expect(new PgDialect().sqlToQuery(rank[0]).sql).toContain('CASE');
		expect(new PgDialect().sqlToQuery(rank[1]).sql).toContain('favorites');
	});

	test('the ingredient subquery keeps its own table inside a relational findMany', () => {
		// db.query.recipes.findMany rebinds every column in its where to the root
		// alias; a raw sql fragment would turn recipe_versions.recipe_id into
		// "recipes"."recipe_id", which does not exist.
		const { where } = textSearch('cookie');
		if (!where) throw new Error('expected a condition');
		const { sql } = new PgDialect().sqlToQuery(mapColumnsInSQLToAlias(where, 'recipes'));
		expect(sql).toContain('v.recipe_id = "recipes"."id"');
		expect(sql).not.toContain('"recipes"."recipe_id"');
	});
});
