import { describe, test, expect } from 'vitest';
import {
	absoluteImage,
	clampDescription,
	isoDuration,
	ldScript,
	pageTitle,
	recipeMeta,
	DEFAULT_META,
	RECIPE_DESCRIPTION_MAX,
	type RecipeMetaInput
} from './seo';
import { inGroup, makeContent, makeIngredient, makeStep } from './recipes/fixtures';
import type { RecipeContent } from './recipes/types';

describe('absoluteImage', () => {
	test('keeps an absolute URL', () => {
		expect(absoluteImage('https://images.example.com/a.jpg')).toBe(
			'https://images.example.com/a.jpg'
		);
	});

	test('drops a relative image path', () => {
		// As an og:image a relative path resolves against the crawler's host,
		// not ours, so it must not be emitted.
		expect(absoluteImage('/None.png')).toBeNull();
	});

	test('null and empty are no image', () => {
		expect(absoluteImage(null)).toBeNull();
		expect(absoluteImage('')).toBeNull();
	});
});

describe('clampDescription', () => {
	test('collapses whitespace', () => {
		expect(clampDescription('a  b\n\tc')).toBe('a b c');
	});

	test('leaves a short description alone', () => {
		expect(clampDescription('Short.')).toBe('Short.');
	});

	test('cuts at a word boundary, not mid-word', () => {
		const long = 'word '.repeat(60).trim();
		const out = clampDescription(long);
		expect(out.length).toBeLessThanOrEqual(161);
		expect(out.endsWith('…')).toBe(true);
		expect(out).not.toMatch(/wo…$/);
	});
});

describe('pageTitle', () => {
	test('suffixes the site name', () => {
		expect(pageTitle('Chocolate Cake')).toBe('Chocolate Cake — Fork');
	});

	test('does not suffix the already-branded default', () => {
		expect(pageTitle(DEFAULT_META.title)).toBe(DEFAULT_META.title);
	});

	test('the default title and description speak to a cook, not a programmer', () => {
		expect(`${DEFAULT_META.title} ${DEFAULT_META.description}`).not.toMatch(
			/commit|diff|git|version control/i
		);
	});
});

const ORIGIN = 'https://fork.test';
const PUBLISHED = new Date('2026-01-02T03:04:05Z');
const CHANGED = new Date('2026-02-03T04:05:06Z');

/** A public recipe's latest version, as the recipe page hands it over. */
function publicRecipe(overrides: Partial<RecipeMetaInput> = {}): RecipeMetaInput {
	return {
		origin: ORIGIN,
		slug: 'cookies-ab12',
		isPublic: true,
		latest: true,
		author: 'chef',
		tags: ['Dessert', 'Baking'],
		parentSlug: null,
		published: PUBLISHED,
		version: {
			...makeContent({
				title: 'Cookies',
				description: 'Crisp edges.',
				imageUrl: 'https://img.test/c.jpg',
				ingredients: [
					makeIngredient('salt'),
					...inGroup('Dough', [makeIngredient('2 cups flour'), makeIngredient('1 egg')])
				],
				steps: [
					makeStep('Heat the oven.'),
					...inGroup('Dough', [makeStep('Mix.'), makeStep('Rest.')]),
					...inGroup('Bake', [makeStep('Bake.')])
				]
			}),
			createdAt: CHANGED
		},
		...overrides
	};
}

const withVersion = (content: Partial<RecipeContent>) =>
	publicRecipe({ version: { ...publicRecipe().version, ...content } });

describe('recipeMeta: who gets a preview', () => {
	test('a public recipe previews as itself and carries Recipe data', () => {
		const meta = recipeMeta(publicRecipe());
		expect(meta).toMatchObject({
			title: 'Cookies',
			description: 'Crisp edges.',
			image: 'https://img.test/c.jpg',
			type: 'article'
		});
		expect(meta.noindex).toBeFalsy();
		expect(meta.jsonLd).toMatchObject({ '@type': 'Recipe', name: 'Cookies' });
	});

	// Friends, Only me and a kept copy all arrive as not public: the page's own
	// title only, no description, photo or Recipe data, and kept out of search.
	test('a recipe that is not public gives only its title, and noindex', () => {
		const meta = recipeMeta(publicRecipe({ isPublic: false }));
		expect(meta).toEqual({ title: 'Cookies', noindex: true });
	});

	test('an earlier version of a public recipe previews as itself but carries no Recipe data: the canonical page is the latest', () => {
		const meta = recipeMeta(publicRecipe({ latest: false }));
		expect(meta.title).toBe('Cookies');
		expect(meta.noindex).toBeFalsy();
		expect(meta.jsonLd).toBeUndefined();
	});

	test('a recipe with no photo, or a relative one, has no image of its own', () => {
		expect(recipeMeta(withVersion({ imageUrl: null })).image).toBeNull();
		expect(recipeMeta(withVersion({ imageUrl: '/None.png' })).image).toBeNull();
		expect(recipeMeta(withVersion({ imageUrl: null })).jsonLd!.image).toBeUndefined();
	});
});

describe('recipeMeta: description', () => {
	test('a long description is trimmed on a word boundary to about RECIPE_DESCRIPTION_MAX', () => {
		const long = 'butter '.repeat(60).trim();
		const { description } = recipeMeta(withVersion({ description: long }));
		expect(description!.length).toBeLessThanOrEqual(RECIPE_DESCRIPTION_MAX + 1);
		expect(description).toMatch(/butter…$/);
	});

	test('without one, it is composed from the yield, the times and the first ingredients', () => {
		const { description } = recipeMeta(
			withVersion({
				description: null,
				servings: 4,
				prepTimeMinutes: 10,
				cookTimeMinutes: 90,
				ingredients: ['2 cups flour', '1 egg', 'salt', 'butter'].map(makeIngredient)
			})
		);
		expect(description).toBe(
			'Serves 4 · 10 min prep · 1 h 30 min cook. Flour, egg, salt and more.'
		);
	});

	test('a recipe that makes something says so, and a bare one says only its name', () => {
		const bare = {
			description: null,
			servings: null,
			prepTimeMinutes: null,
			cookTimeMinutes: null
		};
		expect(
			recipeMeta(withVersion({ ...bare, makes: '12 buns', ingredients: [makeIngredient('flour')] }))
				.description
		).toBe('Makes 12 buns. Flour.');
		expect(recipeMeta(withVersion({ ...bare, ingredients: [] })).description).toBe(
			'Cookies, a recipe on Fork.'
		);
	});
});

describe('recipeMeta: Recipe data', () => {
	const ld = (input = publicRecipe()) => recipeMeta(input).jsonLd!;

	test('names the recipe, its page, photo, author and dates', () => {
		expect(ld()).toMatchObject({
			'@context': 'https://schema.org',
			url: `${ORIGIN}/recipes/cookies-ab12`,
			description: 'Crisp edges.',
			image: ['https://img.test/c.jpg'],
			author: { '@type': 'Person', name: '@chef', url: `${ORIGIN}/users/chef` },
			datePublished: PUBLISHED.toISOString(),
			dateModified: CHANGED.toISOString(),
			keywords: 'Dessert, Baking'
		});
	});

	test('one ingredient string per line as written, groups flattened in order', () => {
		expect(ld().recipeIngredient).toEqual(['salt', '2 cups flour', '1 egg']);
	});

	test('steps are HowToSteps; grouped steps sit in a HowToSection per group', () => {
		expect(ld().recipeInstructions).toEqual([
			{ '@type': 'HowToStep', text: 'Heat the oven.' },
			{
				'@type': 'HowToSection',
				name: 'Dough',
				itemListElement: [
					{ '@type': 'HowToStep', text: 'Mix.' },
					{ '@type': 'HowToStep', text: 'Rest.' }
				]
			},
			{
				'@type': 'HowToSection',
				name: 'Bake',
				itemListElement: [{ '@type': 'HowToStep', text: 'Bake.' }]
			}
		]);
	});

	test('yield and times as stored, and no total: prep and cook can overlap', () => {
		const data = ld(
			withVersion({
				servings: 4,
				makes: '12 buns',
				prepTimeMinutes: 15,
				cookTimeMinutes: 150,
				restTimeMinutes: 60
			})
		);
		expect(data).toMatchObject({
			recipeYield: ['4 servings', '12 buns'],
			prepTime: 'PT15M',
			cookTime: 'PT2H30M'
		});
		expect(data).not.toHaveProperty('totalTime');
	});

	test('a recipe without a yield, times, tags or author leaves those out', () => {
		const data = ld({
			...withVersion({ servings: null, makes: null, prepTimeMinutes: null, cookTimeMinutes: null }),
			tags: [],
			author: null
		});
		for (const key of ['recipeYield', 'prepTime', 'cookTime', 'keywords', 'author', 'isBasedOn'])
			expect(data[key]).toBeUndefined();
	});

	test('is based on a public parent and on the outside source', () => {
		expect(
			ld({
				...withVersion({ sourceName: 'Gran', sourceUrl: 'https://gran.test/c' }),
				parentSlug: 'original-cd34'
			}).isBasedOn
		).toEqual([
			`${ORIGIN}/recipes/original-cd34`,
			{ '@type': 'CreativeWork', name: 'Gran', url: 'https://gran.test/c' }
		]);
		expect(ld(withVersion({ sourceName: 'A card in a drawer' })).isBasedOn).toEqual([
			{ '@type': 'CreativeWork', name: 'A card in a drawer' }
		]);
	});

	test('is based on the exact parent version a fork copied, when it is recorded', () => {
		expect(
			ld({ ...withVersion({}), parentSlug: 'original-cd34', parentVersion: 2 }).isBasedOn
		).toEqual([`${ORIGIN}/recipes/original-cd34?version=2`]);
	});
});

describe('isoDuration', () => {
	test('minutes as an ISO 8601 duration, hours past a day included', () => {
		expect(isoDuration(45)).toBe('PT45M');
		expect(isoDuration(60)).toBe('PT1H');
		expect(isoDuration(90)).toBe('PT1H30M');
		expect(isoDuration(2 * 1440)).toBe('PT48H');
	});

	test('no time is no duration', () => {
		expect(isoDuration(null)).toBeUndefined();
		expect(isoDuration(0)).toBeUndefined();
	});
});

describe('ldScript', () => {
	test('recipe text cannot close the script tag or start markup', () => {
		const name = '</script><img src=x onerror=alert(1)>&\u2028\u2029';
		const out = ldScript({ name });
		const body = out.slice('<script type="application/ld+json">'.length, -'</script>'.length);
		expect(body).not.toMatch(/[<>&\u2028\u2029]/);
		expect(JSON.parse(body)).toEqual({ name });
		expect(out.match(/<\/script>/g)).toHaveLength(1);
	});
});
