import { describe, test, expect } from 'vitest';
import {
	compactCount,
	formatDate,
	MILLION,
	oneOf,
	plural,
	recipeSlug,
	slugify,
	THOUSAND,
	wholeNumber
} from './helpers';

describe('formatDate', () => {
	const date = new Date(2026, 1, 28);

	test('day, short month and year in British order by default', () => {
		expect(formatDate(date)).toBe('28 Feb 2026');
	});

	test('takes other parts in the same locale', () => {
		expect(formatDate(date, { month: 'long', year: 'numeric' })).toBe('February 2026');
	});
});

describe('plural', () => {
	test('one takes the noun as it is; any other count adds an s', () => {
		expect(plural(1, 'fork')).toBe('1 fork');
		expect(plural(0, 'fork')).toBe('0 forks');
		expect(plural(2, 'public recipe')).toBe('2 public recipes');
	});

	test('an irregular plural is passed and used for every count but one', () => {
		expect(plural(1, 'entry', 'entries')).toBe('1 entry');
		expect(plural(0, 'entry', 'entries')).toBe('0 entries');
		expect(plural(3, 'entry', 'entries')).toBe('3 entries');
	});
});

describe('oneOf', () => {
	const LIST = ['all', 'mine', 'saved'] as const;

	test('a member of the list is itself', () => {
		for (const item of LIST) expect(oneOf(LIST, item)).toBe(item);
	});

	test('anything else, missing included, is undefined', () => {
		expect(oneOf(LIST, 'Mine')).toBeUndefined();
		expect(oneOf(LIST, '')).toBeUndefined();
		expect(oneOf(LIST, null)).toBeUndefined();
	});
});

describe('wholeNumber', () => {
	test('digits only read as their number', () => {
		expect(wholeNumber('0')).toBe(0);
		expect(wholeNumber('42')).toBe(42);
	});

	test('signs, decimals, spaces, trailing letters and empty are null', () => {
		for (const value of ['-1', '+1', '1.5', ' 1', '2abc', '1e3', ''])
			expect(wholeNumber(value)).toBeNull();
	});
});

describe('compactCount', () => {
	test('below a thousand, plain digits', () => {
		expect(compactCount(0)).toBe('0');
		expect(compactCount(THOUSAND - 1)).toBe(String(THOUSAND - 1));
	});

	test('from a thousand, one decimal and k, a trailing .0 dropped', () => {
		expect(compactCount(THOUSAND)).toBe('1k');
		expect(compactCount(1.234 * THOUSAND)).toBe('1.2k');
		expect(compactCount(12 * THOUSAND)).toBe('12k');
	});

	test('rounds down, so a count never reads more than it is or rolls into the next unit', () => {
		expect(compactCount(1.29 * THOUSAND)).toBe('1.2k');
		expect(compactCount(MILLION - 1)).toBe('999.9k');
	});

	test('from a million, the same rule with M', () => {
		expect(compactCount(MILLION)).toBe('1M');
		expect(compactCount(2.5 * MILLION)).toBe('2.5M');
	});
});

describe('slugify', () => {
	test('an English title reads as before: lower case, hyphens, no punctuation', () => {
		expect(slugify('Classic Chocolate-Chip Cookies!')).toBe('classic-chocolate-chip-cookies');
		expect(slugify('  snake_case  & more ')).toBe('snake-case-more');
	});

	test('Latin accents fold to their letters; other scripts keep theirs', () => {
		expect(slugify('Crème Brûlée')).toBe('creme-brulee');
		expect(slugify('味噌汁')).toBe('味噌汁');
		expect(slugify('Борщ по-домашнему')).toBe('борщ-по-домашнему');
		// A kana's voicing mark is part of the letter, not an accent to fold.
		expect(slugify('ガーリック')).toBe('ガーリック');
	});
});

describe('recipeSlug', () => {
	const SUFFIX = /-[0-9a-f]{8}$/;

	test('a title in Latin letters, then a random suffix', () => {
		const slug = recipeSlug('Crème Brûlée');
		expect(slug).toMatch(SUFFIX);
		expect(slug.replace(SUFFIX, '')).toBe('creme-brulee');
	});

	test('a title with no Latin letters still gets a readable ASCII slug, unique by its suffix', () => {
		for (const title of ['味噌汁', 'Борщ', '!!!']) {
			const slug = recipeSlug(title);
			expect(slug).toMatch(new RegExp(`^recipe${SUFFIX.source}`));
		}
		expect(recipeSlug('Pho 越南').replace(SUFFIX, '')).toBe('pho');
		expect(recipeSlug('味噌汁')).not.toBe(recipeSlug('味噌汁'));
	});

	test('it can sit in a Location header, which takes bytes up to 255 only', () => {
		const slug = recipeSlug('Борщ crème 味噌');
		expect(() => new Headers({ location: `/recipes/${slug}` })).not.toThrow();
	});
});
