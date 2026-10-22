# Text Editors for Ingredients and Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-row ingredient and step editors with two textareas, parsed on the client for live feedback and on the server as the authority, with old recipe rows backfilled on read.

**Architecture:** Two pure parser modules in `src/lib/recipes/` (`ingredients.ts` on top of `parse-ingredient`, `steps.ts` hand-written) are the only code that turns text into structure or back. `validation.ts` calls them from zod transforms. Every DB reader of `recipe_versions.ingredients` goes through `normalizeIngredients` so old `{ amount, unit, name }` rows become the new `{ text, quantity, quantity2, unit, name }` shape without a migration. The gram converter gains a per-item layer and an `approximate` flag.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript strict, zod 4, parse-ingredient 3.0.0 (new), Vitest with @testing-library/svelte, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-22-ingredient-text-editor-design.md`

## Global Constraints

- `parse-ingredient` pinned to exact `3.0.0` (no caret) because backfill reparses old rows.
- Parser configuration lives in one object: `ignoreUOMs: ['large', 'medium', 'small']`, `normalizeUOM` off, leading `of` stripped (library default).
- No schema migration. JSONB columns keep both shapes; readers normalize.
- Parsed fields are never edited by a human. Every save re-parses from text.
- A line that does not parse is never a validation error.
- Unit test files sit next to source; `vi.hoisted()` for any mock used in a `vi.mock()` factory; `pnpm test:unit` green before every commit.
- Messages kept verbatim: `At least one ingredient is required`, `At least one step is required`.
- Volume conversions are not marked approximate; per-item and Spoonacular `piece` conversions are.

## Review Focus

1. A pasted list with Windows line endings and trailing spaces must parse line by line, not as one line. Pinned in Task 1.
2. An old step whose text contains a blank line must survive open-then-save unchanged except for the documented collapse. Pinned in Task 2.
3. A textarea containing only whitespace must fail with the existing "at least one" message, not save an empty version. Pinned in Task 3.
4. A fork of a recipe whose rows are old-shape must write new-shape rows. Pinned in Task 6.
5. The gram toggle on a list mixing volume, count and unparsed lines must show numbers for the first two and the original text for the third, with `≈` only on count lines. Pinned in Tasks 5 and 6.

---

### Task 1: Ingredient parser and backfill

**Files:**

- Modify: `package.json` (add `"parse-ingredient": "3.0.0"` to dependencies)
- Modify: `src/lib/recipes/types.ts:4-8`
- Create: `src/lib/recipes/ingredients.ts`
- Test: `src/lib/recipes/ingredients.test.ts`

**Interfaces:**

- Produces, in `types.ts`:
  ```ts
  export type Ingredient = {
  	text: string;
  	quantity: number | null;
  	quantity2: number | null;
  	unit: string;
  	name: string;
  };
  export type LegacyIngredient = { amount: string; unit: string; name: string };
  export type StoredIngredient = Ingredient | LegacyIngredient;
  ```
- Produces, in `ingredients.ts`:

  ```ts
  export function parseIngredientLine(line: string): Ingredient;
  export function parseIngredientText(text: string): Ingredient[];
  export function normalizeIngredients(rows: StoredIngredient[]): Ingredient[];
  export function ingredientsToText(rows: Ingredient[]): string; // text joined with '\n'
  ```

- [ ] **Step 1: Install the dependency**

Run: `pnpm add parse-ingredient@3.0.0` then edit `package.json` so the entry is exactly `"parse-ingredient": "3.0.0"`.

- [ ] **Step 2: Write the failing tests**

`ingredients.test.ts`, `describe('parseIngredientLine')`: one `test.each` over the twelve rows of the spec's table asserting `toEqual({ text: line, quantity, quantity2, unit, name })`. Then:

```ts
test('trims the line and stores the trimmed text', () => {
	expect(parseIngredientLine('  1 cup flour  ').text).toBe('1 cup flour');
});
```

`describe('parseIngredientText')`:

```ts
test('splits on \\r\\n and \\n, drops blank and whitespace-only lines', () => {
	const result = parseIngredientText('1 cup flour\r\n\r\n   \n2 eggs  \n');
	expect(result.map((i) => i.text)).toEqual(['1 cup flour', '2 eggs']);
});
test('empty text gives an empty list', () => {
	expect(parseIngredientText('   \n  ')).toEqual([]);
});
```

`describe('normalizeIngredients')`:

```ts
test('rebuilds text from an old row and reparses it', () => {
	expect(normalizeIngredients([{ amount: '2¼', unit: 'cups', name: 'all-purpose flour' }])).toEqual(
		[
			{
				text: '2¼ cups all-purpose flour',
				quantity: 2.25,
				quantity2: null,
				unit: 'cups',
				name: 'all-purpose flour'
			}
		]
	);
});
test('drops empty amount and unit when joining', () => {
	expect(normalizeIngredients([{ amount: '', unit: '', name: 'salt to taste' }])[0].text).toBe(
		'salt to taste'
	);
});
test('moves a size word from the old unit box into the name', () => {
	expect(normalizeIngredients([{ amount: '2', unit: 'large', name: 'eggs' }])[0]).toMatchObject({
		unit: '',
		name: 'large eggs'
	});
});
test('passes a new-shape row through unchanged', () => {
	const row = parseIngredientLine('1 tsp salt');
	expect(normalizeIngredients([row])).toEqual([row]);
});
```

`describe('ingredientsToText')`: one test that two parsed lines join with a single `\n`.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test:unit --run src/lib/recipes/ingredients` Expected: FAIL, module not found.

- [ ] **Step 4: Implement**

`types.ts`: replace the `Ingredient` type with the three types above. Keep the file comment.

`ingredients.ts`: import `parseIngredient` from `parse-ingredient`. One `const OPTIONS = { ignoreUOMs: ['large', 'medium', 'small'] }`. `parseIngredientLine` trims, calls `parseIngredient(line, OPTIONS)`, takes the first result, and maps `quantity`, `quantity2`, `unitOfMeasure ?? ''`, `description` to the `Ingredient`, with `text` the trimmed line. A line the library returns no result for becomes `{ text, quantity: null, quantity2: null, unit: '', name: text }`. `parseIngredientText` normalizes `\r\n`, splits, trims, filters empties, maps. `normalizeIngredients` detects an old row by `'amount' in row`, joins `[amount, unit, name].filter(Boolean).join(' ')`, and returns `parseIngredientLine` of that; new rows return as-is. `ingredientsToText` maps `text` and joins.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test:unit --run src/lib/recipes/ingredients` Expected: PASS. `pnpm exec svelte-check --threshold error` will now report errors in files that use the old `Ingredient` fields; that is expected until Task 6 and is not a reason to change this task.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/recipes/types.ts src/lib/recipes/ingredients.ts src/lib/recipes/ingredients.test.ts
git commit -m "Add the ingredient line parser on parse-ingredient with old-row backfill"
```

---

### Task 2: Step parser and inverse

**Files:**

- Create: `src/lib/recipes/steps.ts`
- Test: `src/lib/recipes/steps.test.ts`

**Interfaces:**

- Consumes: `Step`, `StepAnnotationType` from `types.ts` (unchanged).
- Produces:

  ```ts
  export function parseStepText(text: string): Step[];
  export function stepsToText(steps: Step[]): string;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
const EXAMPLE = `Cream the butter and sugars until pale.\nScrape the bowl once.\n\nFold in the flour.\ntip: Stop as soon as no dry streaks remain.\n\nBake 12 minutes.\nwarning: Oven runs hot, check at 10.`;

test('parses the spec example into three numbered steps', () => {
	expect(parseStepText(EXAMPLE)).toEqual([
		{ step: 1, text: 'Cream the butter and sugars until pale.\nScrape the bowl once.' },
		{ step: 2, text: 'Fold in the flour.', annotation: { type: 'tip', text: 'Stop as soon as no dry streaks remain.' } },
		{ step: 3, text: 'Bake 12 minutes.', annotation: { type: 'warning', text: 'Oven runs hot, check at 10.' } }
	]);
});
test('note: maps to tip and keywords are case-insensitive', () => {
	expect(parseStepText('Mix.\nNOTE: gently').at(0)?.annotation).toEqual({ type: 'tip', text: 'gently' });
});
test('substitution: is kept as its own type', ...); // annotation.type === 'substitution'
test('an annotation with empty text is dropped', () => {
	expect(parseStepText('Mix.\ntip:   ')).toEqual([{ step: 1, text: 'Mix.' }]);
});
test('a keyword on the first line of a block is step text', () => {
	expect(parseStepText('tip: this is a step')).toEqual([{ step: 1, text: 'tip: this is a step' }]);
});
test('only the last annotation line counts; earlier ones stay in the text', () => {
	expect(parseStepText('Mix.\ntip: a\ntip: b')).toEqual([{ step: 1, text: 'Mix.\ntip: a', annotation: { type: 'tip', text: 'b' } }]);
});
test('multiple blank lines and \\r\\n separate blocks', () => {
	expect(parseStepText('A.\r\n\r\n\r\n\r\nB.').map((s) => s.text)).toEqual(['A.', 'B.']);
});
test('whitespace-only text gives no steps', () => {
	expect(parseStepText(' \n\n ')).toEqual([]);
});
```

`describe('stepsToText')`:

```ts
test('round-trips the spec example', () => {
	expect(stepsToText(parseStepText(EXAMPLE))).toBe(EXAMPLE);
});
test('collapses a blank line inside an old step to one newline', () => {
	const old = [{ step: 1, text: 'A.\n\nB.' }];
	expect(stepsToText(old)).toBe('A.\nB.');
	expect(parseStepText(stepsToText(old))).toEqual([{ step: 1, text: 'A.\nB.' }]);
});
test('flattens a newline inside an old annotation to a space', () => {
	const old = [{ step: 1, text: 'Mix.', annotation: { type: 'tip' as const, text: 'a\nb' } }];
	expect(parseStepText(stepsToText(old))).toEqual([
		{ step: 1, text: 'Mix.', annotation: { type: 'tip', text: 'a b' } }
	]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run src/lib/recipes/steps`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`steps.ts`. Keyword regex `/^(tip|warning|substitution|note):\s*(.*)$/i` applied to trimmed lines at index 1 or later within a block. Blocks come from `text.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/)`. Annotation text trimmed; empty means no annotation; `note` maps to `tip`. `stepsToText` writes each step's text with `/\n\s*\n/g` collapsed to `\n`, then `${type}: ${annotation.text.replace(/\s*\n\s*/g, ' ')}` on its own line if present, blocks joined with `\n\n`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test:unit --run src/lib/recipes/steps`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/steps.ts src/lib/recipes/steps.test.ts
git commit -m "Add the step text parser with annotation keywords and its inverse"
```

---

### Task 3: Validation reads text fields

**Files:**

- Modify: `src/lib/recipes/validation.ts:35-70, 112-118`
- Modify: `src/lib/recipes/validation.test.ts` (the `parseRecipeContent` block)
- Modify: `src/routes/recipes/[slug]/edit/page.server.test.ts:103-104, 237-270` (`VALID_INGREDIENTS`, `VALID_STEPS` and the JSON-based 400 tests)

**Interfaces:**

- Consumes: `parseIngredientText`, `parseStepText` from Tasks 1 and 2.
- Produces: `parseRecipeContent(formData): Result<RecipeContent>` unchanged in name and return type; form fields `ingredients` and `steps` are now plain text.

- [ ] **Step 1: Rewrite the content tests**

Replace the `parseRecipeContent` describe. Keep `rejected`, `unwrap`, `content` helpers. Tests:

```ts
const ingredients = '2¼ cups all-purpose flour\n2 large eggs';
const steps = 'Mix.\n\nBake.\ntip: watch it';

test('parses ingredient and step text', () => {
	const value = unwrap(content({ ingredients, steps }));
	expect(value.ingredients.map((i) => i.text)).toEqual([
		'2¼ cups all-purpose flour',
		'2 large eggs'
	]);
	expect(value.steps).toEqual([
		{ step: 1, text: 'Mix.' },
		{ step: 2, text: 'Bake.', annotation: { type: 'tip', text: 'watch it' } }
	]);
});
test('an unparsable ingredient line is kept, not rejected', () => {
	expect(unwrap(content({ ingredients: 'salt to taste', steps })).ingredients[0]).toMatchObject({
		quantity: null,
		name: 'salt to taste'
	});
});
test.each(['', '   \n\n'])('rejects ingredients %j with the existing message', (value) => {
	expect(content({ ingredients: value, steps })).toEqual({
		ok: false,
		error: 'At least one ingredient is required'
	});
});
test.each(['', '   \n\n'])('rejects steps %j with the existing message', (value) => {
	expect(content({ ingredients, steps: value })).toEqual({
		ok: false,
		error: 'At least one step is required'
	});
});
test('a missing field is treated as empty text', () => {
	expect(content({ steps })).toEqual({ ok: false, error: 'At least one ingredient is required' });
});
```

Delete the old `steps` and `ingredients` describe blocks that tested JSON object shapes; their behaviour now lives in Tasks 1 and 2.

In the edit route test, set `VALID_INGREDIENTS = '2 cups flour'` and `VALID_STEPS = 'Mix everything.'`, delete the "invalid JSON" test, and change the two empty-list tests to send `''`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run src/lib/recipes/validation src/routes/recipes`. Expected: FAIL on the new text tests.

- [ ] **Step 3: Implement**

In `validation.ts`: delete `ingredientSchema`, `annotationSchema`, `stepSchema`, `stepsSchema`, `json()`. `contentSchema` becomes

```ts
z.object({
	ingredients: z
		.string()
		.transform(parseIngredientText)
		.pipe(z.array(z.custom<Ingredient>()).min(1, 'At least one ingredient is required')),
	steps: z
		.string()
		.transform(parseStepText)
		.pipe(z.array(z.custom<Step>()).min(1, 'At least one step is required'))
});
```

`parseRecipeContent` passes `text(formData, 'ingredients')` and `text(formData, 'steps')`. Remove the now-unused `StepAnnotationType` import if any.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test:unit --run src/lib/recipes src/routes/recipes`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/validation.ts src/lib/recipes/validation.test.ts "src/routes/recipes/[slug]/edit/page.server.test.ts"
git commit -m "Validate ingredients and steps from textarea text via the parsers"
```

---

### Task 4: Ingredient diff on the new shape

**Files:**

- Modify: `src/lib/recipes/diff.ts:32-65`
- Modify: `src/lib/recipes/diff.test.ts` (the `diffIngredients` block)
- Modify: `src/routes/recipes/[slug]/diff/+page.server.ts:38-41`, `src/routes/+page.server.ts:93-96`

**Interfaces:**

- Consumes: `Ingredient`, `normalizeIngredients`.
- Produces: `diffIngredients(from: Ingredient[], to: Ingredient[]): IngredientDiffRow[]`, same row types.

- [ ] **Step 1: Update the tests**

Replace the test fixtures' `{ amount, unit, name }` literals with `parseIngredientLine(...)` calls from Task 1. Change "changed amount" to assert that `quantity` 1 vs 2 on the same name yields one `modified` row whose segments, joined, read as the two `text` values. Add:

```ts
test('an old-shape list and its normalized equivalent are all unchanged', () => {
	const old = [{ amount: '1', unit: 'cup', name: 'flour' }];
	const rows = diffIngredients(normalizeIngredients(old), [parseIngredientLine('1 cup flour')]);
	expect(rows).toEqual([{ status: 'unchanged', ingredient: parseIngredientLine('1 cup flour') }]);
});
test('a changed range end is modified', () => {
	const rows = diffIngredients(
		[parseIngredientLine('2-3 cloves garlic')],
		[parseIngredientLine('2-4 cloves garlic')]
	);
	expect(rows[0].status).toBe('modified');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run src/lib/recipes/diff`. Expected: FAIL, `amount` missing.

- [ ] **Step 3: Implement**

`unchanged` compares `quantity`, `quantity2`, `unit`. Modified rows call `diffInline(fromIngredient.text, ingredient.text)`. In the two page loads, replace the `as Parameters<...>[0]` casts with `normalizeIngredients(version.ingredients)`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test:unit --run src/lib/recipes/diff`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/diff.ts src/lib/recipes/diff.test.ts "src/routes/recipes/[slug]/diff/+page.server.ts" src/routes/+page.server.ts
git commit -m "Diff ingredients by quantity and text, normalizing old rows on load"
```

---

### Task 4b: Step annotation diff

**Files:**

- Modify: `src/lib/recipes/diff.ts:15-17, 75-110`
- Modify: `src/lib/recipes/diff.test.ts` (the `diffSteps` block)
- Modify: `src/lib/components/recipes/VersionDiff.svelte:69-90`
- Test: `src/lib/components/recipes/VersionDiff.svelte.test.ts`

**Interfaces:**

- Consumes: `Step`, `StepAnnotation`, `diffInline`.
- Produces:

  ```ts
  export type AnnotationDiff = {
  	status: 'added' | 'removed' | 'modified';
  	type: StepAnnotationType; // the `to` type, or the `from` type when removed
  	segments: InlineSegment[];
  };
  export type StepDiffRow =
  	| { status: 'added' | 'removed' | 'unchanged'; step: Step }
  	| {
  			status: 'modified';
  			stepNumber: number;
  			segments: InlineSegment[];
  			annotation?: AnnotationDiff;
  	  };
  ```

  A step is `modified` when its text differs or its annotation differs (type or text, added or removed). When only the annotation changed, `segments` is `diffInline(text, text)` (all unchanged) and `annotation` is set. A changed annotation type with the same text is `modified` with all-unchanged segments and the new `type`.

- [ ] **Step 1: Write the failing tests**

```ts
test('adding an annotation marks the step modified with unchanged text segments', () => {
	const from = [step(1, 'Bake.')];
	const to = [{ ...step(1, 'Bake.'), annotation: { type: 'tip' as const, text: 'watch it' } }];
	const [row] = diffSteps(from, to);
	expect(row).toMatchObject({ status: 'modified', stepNumber: 1, annotation: { status: 'added', type: 'tip' } });
	if (row.status === 'modified') {
		expect(row.segments.every((s) => s.type === 'unchanged')).toBe(true);
		expect(row.annotation?.segments).toEqual([{ type: 'added', text: 'watch it' }]);
	}
});
test('removing an annotation is modified with a removed annotation diff', ...); // annotation.status 'removed', segments [{ removed, 'watch it' }]
test('editing annotation text inline-diffs the annotation only', ...);     // 'watch it' → 'watch it closely': annotation.status 'modified', a segment added 'closely'
test('changing only the annotation type is modified', ...);                 // tip → warning, same text: annotation.status 'modified', type 'warning'
test('identical annotations stay unchanged', ...);
test('changed text and changed annotation both appear on one row', ...);
```

`VersionDiff.svelte.test.ts`: a modified row with `annotation: { status: 'added', type: 'tip', segments }` renders the annotation text under the step with the `diff-added` class on its wrapper; a row without `annotation` renders no annotation line.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run src/lib/recipes/diff src/lib/components/recipes/VersionDiff`. Expected: FAIL, `annotation` undefined.

- [ ] **Step 3: Implement**

In `diffSteps`, replace the `fromStep.text === toStep.text` check with `textSame && annotationSame`, where `annotationSame` compares `type` and `text` of both annotations or both absent. Build `annotation` via a small `diffAnnotation(from?: StepAnnotation, to?: StepAnnotation): AnnotationDiff | undefined` in the same file: `added` with `diffInline('', to.text)`, `removed` with `diffInline(from.text, '')`, `modified` with `diffInline(from.text, to.text)`, `undefined` when equal. In `VersionDiff.svelte`, under a modified step's content, render `{#if row.annotation}<span class="diff-annotation diff-{row.annotation.status}">{row.annotation.type}: {@render segments(row.annotation.segments, false)}</span>{/if}`, styled like `RecipeMethod`'s annotation line (italic, smaller) with the existing `diff-*` colouring.

- [ ] **Step 4: Run to verify pass**

Run: same command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/diff.ts src/lib/recipes/diff.test.ts src/lib/components/recipes/VersionDiff.svelte src/lib/components/recipes/VersionDiff.svelte.test.ts
git commit -m "Show step annotation changes in the version diff"
```

---

### Task 5: Gram converter with a per-item layer and approximate flag

**Files:**

- Modify: `src/lib/server/ingredientDensities.ts` (append `PIECE_GRAMS` and `lookupPieceGrams`)
- Modify: `src/routes/api/convert-to-grams/+server.ts:5-9, 42-48, 54-73, 130-150`
- Test: `src/routes/api/convert-to-grams/server.test.ts`, `src/lib/server/ingredientDensities.test.ts` (create if absent)

**Interfaces:**

- Produces:

  ```ts
  export const PIECE_GRAMS: Record<string, number>; // 'egg': 50, 'egg white': 33, 'egg yolk': 18, plus ~12 produce items
  export function lookupPieceGrams(quantity: number, name: string): number | null; // longest matching key wins
  ```

  Endpoint request body: `{ ingredients: Ingredient[] }` (new shape; `text`, `unit`, `name` strings ≤ 200 chars, `quantity` number or null, `quantity2` number or null). Response: `{ results: ({ grams: number; approximate: boolean } | null)[] }`.

- [ ] **Step 1: Write the failing tests**

`ingredientDensities.test.ts`:

```ts
test('matches the longest key', () => {
	expect(lookupPieceGrams(2, 'large egg whites')).toBe(66);
});
test('returns null for an unknown item', () => {
	expect(lookupPieceGrams(1, 'unicorn')).toBeNull();
});
```

`server.test.ts`, in `conversion`: rewrite request bodies to the new shape via `parseIngredientLine`. Add:

```ts
test('unparsed line gives null', ...);                       // 'salt to taste' → null
test('count line in the piece table is approximate', ...);  // '2 eggs' → { grams: 100, approximate: true }
test('count line not in the table asks Spoonacular with piece', ...); // mock fetch; assert URLSearchParams has sourceUnit=piece; result approximate: true
test('volume line is not approximate', ...);                 // '1 cup flour' → approximate: false
```

In `input validation`: an old-shape body (`{ amount, unit, name }`) returns 400 `INVALID_INGREDIENTS`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run src/routes/api/convert-to-grams src/lib/server/ingredientDensities`. Expected: FAIL.

- [ ] **Step 3: Implement**

Delete `parseAmount`. `isIngredientInput` checks the new shape. Per ingredient: `quantity === null` → `null`; `unit` non-empty → `lookupGrams` then Spoonacular, `approximate: false`; `unit` empty → `lookupPieceGrams` with `approximate: true`, else Spoonacular with `sourceUnit: 'piece'` and `approximate: true`. Spoonacular `null` stays `null`.

- [ ] **Step 4: Run to verify pass**

Run: same command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/ingredientDensities.ts src/lib/server/ingredientDensities.test.ts src/routes/api/convert-to-grams/
git commit -m "Convert count ingredients to grams via a per-item table and flag estimates"
```

---

### Task 6: Readers of the new shape

**Files:**

- Modify: `src/lib/server/db/schema.ts:110` (`$type<StoredIngredient[]>()`)
- Modify: `src/routes/recipes/[slug]/+page.server.ts:44-66` (normalize every version's ingredients in the load) and `:172` (fork writes `normalizeIngredients(latestVersion.ingredients)`)
- Modify: `src/routes/recipes/[slug]/components/RecipeIngredients.svelte:8, 60-82`
- Modify: `src/routes/recipes/[slug]/components/RecipeMethod.svelte:43`
- Modify: `src/lib/components/recipes/VersionDiff.svelte:59-61, 84`
- Test: `src/routes/recipes/[slug]/page.server.test.ts` (fork case; create if absent, matching the edit route test's mock pattern), `src/routes/recipes/[slug]/components/RecipeIngredients.svelte.test.ts` (create), `src/lib/components/recipes/VersionDiff.svelte.test.ts`

**Interfaces:**

- Consumes: `normalizeIngredients`, response shape from Task 5.
- Produces: `RecipeIngredients` prop type becomes `Omit<RecipeVersion, 'ingredients'> & { ingredients: Ingredient[] }` (the schema type now says `StoredIngredient[]`, the load guarantees normalized); `gramCache` typed `({ grams: number; approximate: boolean } | null)[] | null`. The `[slug]/+page.svelte` parent passes the normalized `currentVersion` unchanged.

- [ ] **Step 1: Write the failing tests**

Fork: with `findFirst` returning a version whose ingredients are old-shape, the inserted version's `ingredients` equals `normalizeIngredients(oldRows)`.

`RecipeIngredients.svelte.test.ts` (mock `fetch` via `vi.stubGlobal`):

```ts
test('prints each ingredient line as typed', ...);              // getByText('2¼ cups all-purpose flour')
test('shows grams, ≈ on approximate ones, and the estimate note', ...); // results [{100,true},{120,false},null] → '≈100g', '120g', third line unchanged, note text present
test('shows no estimate note when nothing is approximate', ...);
```

`VersionDiff.svelte.test.ts`: an unchanged ingredient row renders its `text`; a step row with `\n` renders on two lines (`white-space` style or `<br>`; assert via `toHaveStyle` or `innerHTML`).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:unit --run "src/routes/recipes/[slug]" src/lib/components/recipes/VersionDiff`. Expected: FAIL.

- [ ] **Step 3: Implement**

Load: `versions: recipe.versions.map((v) => ({ ...v, ingredients: normalizeIngredients(v.ingredients) }))` before deriving `currentVersion`. `RecipeIngredients`: key `#each` on `i`, print `{ingredient.text}`, prefix `≈` when `gramCache[i]?.approximate`, `title="Estimated weight for a whole item"`, and under the list `{#if showGrams && gramCache?.some((g) => g?.approximate)}<p class="form-hint">Whole-item weights are estimates, not exact.</p>{/if}`. `RecipeMethod` and `VersionDiff` step text: add `whitespace-pre-line`.

- [ ] **Step 4: Run to verify pass, then type check**

Run: `pnpm test:unit` and `pnpm exec svelte-check --threshold error`. Expected: PASS, 0 errors. Any remaining `amount` reference is a missed reader.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/db/schema.ts "src/routes/recipes/[slug]" src/lib/components/recipes/VersionDiff.svelte src/lib/components/recipes/VersionDiff.svelte.test.ts
git commit -m "Read ingredients in the new shape everywhere, normalizing old rows on load"
```

---

### Task 7: IngredientEditor as a textarea

**Files:**

- Rewrite: `src/lib/components/recipes/IngredientEditor.svelte`
- Test: `src/lib/components/recipes/IngredientEditor.svelte.test.ts` (create)

**Interfaces:**

- Produces: props `{ value: string }` with `value` bindable; renders `<textarea id="ingredients" name="ingredients">` with `<label for="ingredients">Ingredients</label>`; note container has `aria-live="polite"`.

- [ ] **Step 1: Write the failing tests**

```ts
test('renders the value in a labelled textarea', ...);       // getByLabelText('Ingredients') has value
test('lists lines that did not parse', async () => { /* fireEvent.input with '1 cup flour\nsalt to taste'; expect note contains 'salt to taste' and not '1 cup flour' */ });
test('hides the note when every line parses or the box is empty', ...);
test('updates the bound value on input', ...);              // render with $state wrapper; assert value changed
```

- [ ] **Step 2: Run to verify failure.** Run: `pnpm test:unit --run src/lib/components/recipes/IngredientEditor`. Expected: FAIL.

- [ ] **Step 3: Implement**

Textarea with `rows={10}`, placeholder `2¼ cups all-purpose flour\n2 large eggs`, `bind:value`. `const unparsed = $derived(parseIngredientText(value).filter((i) => i.quantity === null).map((i) => i.text))`. Note copy: "These lines will be saved as written but can't be scaled:" followed by the lines. Reuse `.form-hint`.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/recipes/IngredientEditor.svelte src/lib/components/recipes/IngredientEditor.svelte.test.ts
git commit -m "Replace the ingredient grid with a textarea and live parse note"
```

---

### Task 8: StepEditor as a textarea

**Files:**

- Rewrite: `src/lib/components/recipes/StepEditor.svelte`
- Test: `src/lib/components/recipes/StepEditor.svelte.test.ts` (create)

**Interfaces:**

- Produces: props `{ value: string }` bindable; `<textarea id="steps" name="steps">` with label "Steps"; no `annotations` prop.

- [ ] **Step 1: Write the failing tests**

```ts
test('renders the value in a labelled textarea', ...);
test('shows the hint about blank lines and note keywords', ...); // getByText(/tip:/)
test('updates the bound value on input', ...);
```

- [ ] **Step 2: Run to verify failure.** Expected: FAIL.

- [ ] **Step 3: Implement**

`rows={12}`, placeholder `Cream the butter and sugar.\n\nFold in the flour.\ntip: Stop when no dry streaks remain.`. Hint copy: "Separate steps with a blank line. Add a note under a step with tip:, warning: or substitution: on its own line."

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/recipes/StepEditor.svelte src/lib/components/recipes/StepEditor.svelte.test.ts
git commit -m "Replace the step list editor with a textarea"
```

---

### Task 9: Pages bind text

**Files:**

- Modify: `src/routes/recipes/new/+page.svelte:14-18, 33-36, 45-50, 131-135`
- Modify: `src/routes/recipes/[slug]/edit/+page.svelte:14-25, 28-33, 169-180`
- Modify: `src/routes/recipes/new/page.svelte.test.ts`, `src/routes/recipes/[slug]/edit/page.svelte.test.ts`

**Interfaces:**

- Consumes: `ingredientsToText`, `normalizeIngredients`, `stepsToText`, both editors' `value` prop.

- [ ] **Step 1: Update and add page tests**

Edit page `makeData()` gets a `latestVersion` with one old-shape ingredient and one step with a tip. Add:

```ts
test('fills both textareas from the latest version', ...); // Ingredients textarea value '1 cup flour'; Steps textarea value 'Mix.\ntip: gently'
test('shows unsaved changes for the content form after editing the ingredients textarea', ...); // replaces the "editing an ingredient" test
```

New page: the typing test now targets `getByLabelText('Ingredients')`.

- [ ] **Step 2: Run to verify failure.** Run: `pnpm test:unit --run src/routes/recipes`. Expected: FAIL.

- [ ] **Step 3: Implement**

Both pages: delete `ingredientsInput`, `stepsInput`, `serializeContent`, the two hidden inputs and the `onsubmit`. Replace the `$state` arrays with `let ingredientsText = $state(...)` and `let stepsText = $state(...)`; on edit initialised from `ingredientsToText(data.latestVersion?.ingredients ?? [])` (the load already normalized) and `stepsToText(data.latestVersion?.steps ?? [])`, on new from `''`. Editors: `<IngredientEditor bind:value={ingredientsText} />`, `<StepEditor bind:value={stepsText} />`. Edit page dirty: `contentDirty = $derived(ingredientsText !== savedIngredients || stepsText !== savedSteps)` with the two saved constants captured at init (keep the `svelte-ignore` comments).

- [ ] **Step 4: Run to verify pass, type check, lint**

Run: `pnpm test:unit && pnpm exec svelte-check --threshold error && pnpm lint`. Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/routes/recipes
git commit -m "Bind the new and edit pages to the text editors"
```

---

### Task 10: Seed, e2e and README

**Files:**

- Modify: `src/lib/server/db/seed.ts:27-130` (ingredient arrays) and the three `ingredients:` inserts
- Modify: `e2e/authenticated.test.ts:90-96`
- Modify: `README.md` wherever the ingredient or step editor is described (grep `ingredient` and `step`)

- [ ] **Step 1: Seed**

Wrap each `COOKIE_INGREDIENTS_*` and other arrays in `normalizeIngredients(...)` at the point of insert, so the literals stay readable and the DB gets the new shape. Run `pnpm db:seed` against local and open the cookie recipe to confirm `2 large eggs` renders and the gram toggle shows `≈100g`.

- [ ] **Step 2: e2e**

Replace lines 90-96 with `await page.getByLabel('Ingredients').fill('2 cups flour')` and `await page.getByLabel('Steps').fill('Mix all ingredients.')`. Run `pnpm test:e2e` (or the project's Playwright script) locally with Supabase up. Expected: PASS.

- [ ] **Step 3: README**

Update any sentence describing per-row editors or the ingredient JSON shape to describe the textareas and the parsed shape. If none exists, skip.

- [ ] **Step 4: Full verification**

Run: `pnpm test:unit && pnpm exec svelte-check --threshold error && pnpm lint`. Then `pnpm dev`, open `/recipes/new`, paste the spec's twelve lines, confirm the note lists the three unparsable ones, save, confirm the recipe page prints every line as typed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/db/seed.ts e2e/authenticated.test.ts README.md
git commit -m "Seed and test the text editors end to end"
```
