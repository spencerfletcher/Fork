import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// One tag shape for every component and loader that passes tags around, so a
// field added to it reaches them all. RecipeHeader still writes it inline.
const consumers = [
	'src/lib/server/tagFilter.ts',
	'src/lib/components/ui/TagTabs.svelte',
	'src/lib/components/ui/SearchFilters.svelte',
	'src/lib/components/recipes/RecipeForm.svelte',
	'src/lib/components/recipes/RecipeCard.svelte'
];

describe('TagChip', () => {
	test.each(consumers)('%s takes the tag shape from types.ts', (path) => {
		const source = readFileSync(path, 'utf8');
		expect(source).toMatch(/import type \{[^}]*\bTagChip\b[^}]*\} from '#lib\/recipes\/types\.js'/);
		expect(source).not.toMatch(/\{\s*id: number;\s*name: string;\s*slug: string\s*\}/);
		expect(source).not.toContain("Pick<Tag, 'id' | 'name' | 'slug'>");
	});
});
