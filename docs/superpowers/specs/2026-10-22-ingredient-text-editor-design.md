# Text editors for ingredients and steps — design

Date: 2026-10-22. Status: draft, awaiting approval.

## Intent

Replace the per-row editors on the new and edit recipe pages with two textareas: one for ingredients, one for steps. People type the recipe the way they would write it on paper. The app parses each ingredient line into a quantity, unit and name, and each step paragraph into a step with an optional note. Lines that do not parse are kept as written and still save; the user is told which ones, and features that need structure (scaling, gram conversion) skip them.

Why: the ingredient grid is eleven rows of three inputs for an ordinary recipe, and the step editor is a row per step with a note widget. The hard part of entering a recipe is typing it, not structuring it.

## Goals

- Entering a recipe is two textareas. No add buttons, no drag handles, no per-row widgets. Reordering is moving lines.
- An ingredient line that parses gets structured fields; one that does not still saves as written.
- The user sees which ingredient lines did not parse, live while typing.
- Parsed fields never drift from the text: text is the only thing a human edits, and every save re-parses everything.
- One parser per field, used in the browser for the live note and on the server as the authority.
- Existing recipes keep rendering with no data migration.
- Scaling becomes possible later because quantities are stored as numbers.

## Non-goals

- Scaling, unit conversion, shopping lists. Not built here.
- Rebuilding `2¼` from `2.25` for display. The recipe page prints the line as typed. Once scaling exists, `2.25` reads fine.
- Changing the recipe page or diff view layouts beyond what the new fields require.
- A rich editor. A plain textarea is enough. CodeMirror or similar is a later upgrade of the editor component only, if inline highlighting is ever wanted; the parsers do not depend on the widget.
- Group headers in the ingredient list (`For the icing:`). The parser flags them; this design stores them as unparsed lines and nothing more. A later change can render them as headings.

## Anti-goals

- Rejecting a save because a line did not parse.
- A client-side grammar that differs from the server's.
- Parsed fields that can be edited independently of the text.

## Libraries

**parse-ingredient 3.0.0** (MIT, TypeScript types included, one runtime dependency `numeric-quantity` by the same author, published September 2026) does the ingredient line parsing. Verified against every row of the table below in a scratch install. It is a new dependency; the project has none for this today.

Configuration, in one place:

- `ignoreUOMs: ['large', 'medium', 'small']`, so sizes stay part of the name. This is the "strict units" decision: a unit is only something on parse-ingredient's list minus those three. A later greedy swap is a change to this one options object.
- Leading `of` is stripped by default (`1 cup of flour` → `flour`). Keep.
- `normalizeUOM` off. Units are stored as typed (`tbsp.` stays `tbsp.`).

Steps need no library.

## Data model

Both types live in `src/lib/recipes/types.ts`. Storage is the existing JSONB columns on `recipe_versions`; no migration. Versions are append-only, so old rows keep their old shape and readers backfill.

### Ingredient

```ts
export type Ingredient = {
	text: string; // the line as typed, trimmed. Source of truth and what the recipe page prints.
	quantity: number | null; // null when the line did not parse
	quantity2: number | null; // upper end of a range like "2-3"; null otherwise
	unit: string; // '' when absent or unparsed
	name: string; // description after quantity and unit; the whole line when unparsed
};
```

"Parsed" means `quantity !== null`. No separate flag.

Examples, with `ignoreUOMs` applied:

| Line                          | quantity | quantity2 | unit     | name                          |
| ----------------------------- | -------- | --------- | -------- | ----------------------------- |
| `2¼ cups all-purpose flour`   | 2.25     | null      | `cups`   | `all-purpose flour`           |
| `2 large eggs`                | 2        | null      | ``       | `large eggs`                  |
| `1 cup packed brown sugar`    | 1        | null      | `cup`    | `packed brown sugar`          |
| `1 1/2 tsp vanilla`           | 1.5      | null      | `tsp`    | `vanilla`                     |
| `2-3 cloves garlic`           | 2        | 3         | `cloves` | `garlic`                      |
| `100–150 g sugar`             | 100      | 150       | `g`      | `sugar`                       |
| `2 tbsp. olive oil`           | 2        | null      | `tbsp.`  | `olive oil`                   |
| `1 cup of flour`              | 1        | null      | `cup`    | `flour`                       |
| `salt to taste`               | null     | null      | ``       | `salt to taste`               |
| `juice of half a lemon`       | null     | null      | ``       | `juice of half a lemon`       |
| `flaky sea salt, for topping` | null     | null      | ``       | `flaky sea salt, for topping` |
| `1 cup`                       | 1        | null      | ``       | `cup`                         |

The last row is what the library returns. Treat it as parsed; a name of `cup` is odd but harmless, and rejecting it would mean a second grammar.

**Old rows** have `{ amount: string, unit, name }` and no `text` or `quantity`. A single backfill helper, called wherever versions are loaded, produces the new shape: `text` is `[amount, unit, name]` joined with single spaces with empties dropped, and `quantity`, `quantity2` come from running that text through the same parser. The builder chooses its location and name. New saves always write the new shape.

### Step

`Step` is unchanged: `{ step: number; text: string; annotation?: { type; text } }`. Step text may now contain newlines; the recipe page must render them as line breaks (`white-space: pre-line` or equivalent). Old rows need no backfill.

## Parsers

Both live in `src/lib/recipes/`, pure, no server imports, importable from components and from `validation.ts`.

### `ingredients.ts`

```ts
export function parseIngredientText(text: string): Ingredient[];
```

Splits on newlines (handling `\r\n`), trims each line, drops blank lines, runs each through parse-ingredient with the configuration above, and maps the result to `Ingredient`. Never throws on content. Also exports the backfill helper for old rows, or that lives next to it; builder's call.

### `steps.ts`

```ts
export function parseStepText(text: string): Step[];
```

Grammar:

1. Normalise `\r\n` to `\n`, trim the whole text.
2. Split into blocks on one or more blank lines (a line is blank if it is empty after trimming).
3. Within a block, a line whose trimmed form starts with `tip:`, `warning:`, `substitution:` or `note:` (case-insensitive) is an annotation line. `note:` maps to type `tip`. The remaining text after the colon, trimmed, is the annotation text. Only the last annotation line in a block is kept; earlier ones are folded into the step text as written. Empty annotation text means no annotation.
4. Every other line in the block, joined with `\n`, trimmed, is the step text. A block with no step text (annotation only) is dropped.
5. Steps are numbered from 1 in order.

Example:

```
Cream the butter and sugars until pale.
Scrape the bowl once.

Fold in the flour.
tip: Stop as soon as no dry streaks remain.

Bake 12 minutes.
warning: Oven runs hot, check at 10.
```

gives three steps; the first has a two-line text, the second a tip, the third a warning.

Inverse, for loading into the editor: each step's text, then its annotation as `type: text` on its own line if present, blocks joined with a blank line. Builder exports it from the same module so the round trip has one test.

## Validation

`validation.ts` changes the two content fields from JSON to text:

- Form field `ingredients` is the raw textarea string. Schema: `z.string().transform(parseIngredientText).pipe(z.array(...).min(1, 'At least one ingredient is required'))` or equivalent. Per-line object validation goes away; the parser owns shape.
- Form field `steps` is the raw textarea string. Schema runs `parseStepText` and requires at least one step with the existing message. The old step object schema and annotation enum checks go away; the parser can only produce valid types.
- `RecipeContent` stays `{ ingredients: Ingredient[]; steps: Step[] }`.

## Editors

### `IngredientEditor.svelte`, rewritten

- One `<textarea name="ingredients">` labelled "Ingredients". Placeholder shows two example lines. Rows grow with content or start at ten; builder's call.
- Prop `value: string`, bindable. The page owns the string.
- Below it, a live note listing lines that did not parse, from `parseIngredientText(value)` on each change. Must say those lines save as written and will not scale. `aria-live="polite"`. Hidden when every line parses or the textarea is empty.
- No hidden input, no JSON. The textarea is the form field.

### `StepEditor.svelte`, rewritten

- One `<textarea name="steps">` labelled "Steps". Placeholder shows one step, a blank line, and a second step with a `tip:` line under it.
- Prop `value: string`, bindable.
- A short permanent hint under it: steps are separated by a blank line; add a note with `tip:`, `warning:` or `substitution:` on its own line. No live parse note is needed; nothing fails to parse.
- The `annotations` prop goes away. Both pages get notes.

### Pages

- `serializeContent` and the two hidden inputs are deleted on both pages.
- Edit page initialises both strings from the loaded version: ingredients by joining backfilled `text` with newlines, steps via the inverse function.
- Dirty tracking on the edit page compares each string to its initial value. The JSON compare goes away.
- New page starts both strings empty.

## Readers of `Ingredient` and `Step`

- `RecipeIngredients.svelte`: prints `text` only, one line per ingredient, replacing the amount-plus-unit span and name. Gram toggle: when grams are shown and the converter returned a value, print the gram value in place of the line's leading quantity is not required; print `Ng · text` or similar. Builder's call, keep it simple.
- `api/convert-to-grams`: accepts the new shape, uses `quantity` directly and drops its own `parseAmount`. Returns `null` for ingredients with `quantity === null` or empty `unit`. Its request validation changes to match. Must still accept old-shape rows if the recipe page ever sends them; the backfill at load time makes that moot, so it may require the new shape.
- `diff.ts` `diffIngredients`: keys on `name`, compares `quantity`, `quantity2` and `unit` instead of `amount` and `unit`. The modified row's inline diff compares `text` strings. Unparsed lines have the whole line as name, so edits read as removed plus added. Accepted.
- `VersionDiff.svelte`: prints `text` for ingredient rows.
- `RecipeMethod.svelte`: renders multi-line step text with line breaks. Annotation rendering unchanged.
- `diff.ts` `diffSteps`: unchanged; text with newlines diffs as text.
- Seed script: writes the new ingredient shape. Builder may generate it by running the existing amount-unit-name triples through the backfill helper.

## Tests

Order: server first, then components, then e2e.

1. `ingredients.test.ts`: every row of the table; `\r\n`; blank and whitespace lines dropped; leading and trailing whitespace; the backfill helper on an old-shape row and on a new-shape row (no-op).
2. `steps.test.ts`: the example above; `note:` maps to tip; case-insensitive keyword; annotation with empty text dropped; annotation-only block dropped; multiple blank lines between blocks; a step with internal newlines; round trip through the inverse function.
3. `validation.test.ts`: text reaches each parser; empty or whitespace-only text fails with the existing messages; the old JSON-shape tests are removed.
4. `diff.test.ts`: an old-shape list and its backfilled new-shape equivalent diff as unchanged; a quantity change shows as modified.
5. `convert-to-grams` server test: unparsed ingredient yields `null`.
6. `IngredientEditor.svelte.test.ts`: value renders; an unparsable line appears in the note; fixing it clears the note; binding updates.
7. `StepEditor.svelte.test.ts`: value renders; hint present; binding updates.
8. Page component tests: edit page initialises both textareas from a version, including an old-shape ingredient; existing error and state tests still pass with the new fields.
9. e2e `authenticated.test.ts`: the three placeholder fills and the step textarea fill become one fill per textarea.

## Left to the builder

- Backfill helper name and location.
- Note and hint wording and styling within existing form styles.
- Textarea sizing.
- Gram display format on the recipe page.
- Whether `parseIngredientText` is called once per keystroke or debounced. Lists are short; once per keystroke is fine unless it measurably is not.

## Risks

- Names now carry whatever follows the unit, including notes like `, for topping`. The ingredient diff keys on name, so a changed note reads as a replaced ingredient. Accepted.
- Users who typed `large` as a size in a unit box before get `large` in the name after backfill, since backfill reparses the joined text. Correct per the strict decision.
- parse-ingredient's unit list is the library's. If a future version changes it, backfilled old rows could reparse differently. Pin the exact version.
- A step whose first line happens to start with `tip:` becomes an annotation-only block and is dropped. Documented in the hint; acceptable.
