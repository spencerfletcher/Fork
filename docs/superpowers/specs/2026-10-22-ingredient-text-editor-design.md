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

Both types live in `src/lib/recipes/types.ts`. Storage is the existing JSONB columns on `recipe_versions`; no migration. Existing rows are not read in the old shape: the database is reseeded (see below).

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

**Existing rows** in the old `{ amount, unit, name }` shape are not supported. The site is pre-production; the seed is rewritten and the database reseeded. No backfill, no legacy type.

### Step

`Step` loses its stored number: `{ text: string; annotation?: { type; text } }`. Position in the list is the number. Step text may contain newlines; the recipe page renders them as line breaks (`white-space: pre-line` or equivalent).

## Parsers

Both live in `src/lib/recipes/`, pure, no server imports, importable from components and from `validation.ts`.

### `ingredients.ts`

```ts
export function parseIngredientText(text: string): Ingredient[];
```

Splits on newlines (handling `\r\n`), trims each line, drops blank lines, runs each through parse-ingredient with the configuration above, and maps the result to `Ingredient`. Never throws on content. Also exports `ingredientsToText(rows): string` for loading the editor.

### `steps.ts`

```ts
export function parseStepText(text: string): Step[];
```

Grammar:

1. Normalise `\r\n` to `\n`, trim the whole text.
2. Split into blocks on one or more blank lines (a line is blank if it is empty after trimming).
3. Within a block, a line after the first whose trimmed form starts with `tip:`, `warning:` or `substitution:` (case-insensitive) is an annotation line. The first line of a block is always step text, so a step that happens to begin with `tip:` is never swallowed. The text after the colon, trimmed, is the annotation text. Only the last annotation line in a block is kept; earlier ones stay in the step text as written. Empty annotation text means no annotation.
4. Every other line in the block, joined with `\n`, trimmed, is the step text.
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

Inverse, `stepsToText`, for loading into the editor: each step's text, then its annotation as `type: text` on its own line if present, blocks joined with a blank line. `parseStepText` is the only writer of steps, so the inverse does no sanitising; the round-trip test asserts `stepsToText(parseStepText(x)) === x` for the example.

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
- Edit page initialises both strings from the loaded version via `ingredientsToText` and `stepsToText`.
- Dirty tracking on the edit page compares each string to its initial value. The JSON compare goes away.
- New page starts both strings empty.

## Readers of `Ingredient` and `Step`

- `RecipeIngredients.svelte`: prints `text` only, one line per ingredient, replacing the amount-plus-unit span and name, and keys the `#each` on index rather than name. Gram weights are always shown when the local tables know the line, in `text-sienna`: after the measure for a measured line (`2¼ cups (281g) all-purpose flour`), trailing for a counted line (`2 large eggs (≈100g)`). A range shows both ends (`240–480g`). An approximate value is prefixed `≈` with a `title` explaining it, and when any shown value is approximate a one-line note under the list says whole-item weights are estimates, not a source of truth.
- `gramsFor` in `src/lib/server/ingredientDensities.ts`, called from the recipe page load for every ingredient. No HTTP endpoint and no third-party conversion service. Returns `{ grams, grams2, approximate }` or `null` for `quantity === null` and for names the tables do not know. Two layers:
  1. Measured lines: weight units convert directly; volume units go through the density table in `gramTables.ts`. Keys match longest-first as whole words, so `almond flour, sifted` meets `almond flour` before `flour`. Not marked approximate.
  2. Counted lines (empty unit): the per-item table in `gramTables.ts`, grams per whole item (egg 50, egg white 33, egg yolk 18, common produce), matched the same way. Result is `quantity × grams`, marked approximate.
- `diff.ts` `diffIngredients`: keys on `name`, compares `quantity`, `quantity2` and `unit` instead of `amount` and `unit`. The modified row's inline diff compares `text` strings. Unparsed lines have the whole line as name, so edits read as removed plus added. Accepted.
- `VersionDiff.svelte`: prints `text` for ingredient rows.
- `RecipeMethod.svelte`: renders multi-line step text with line breaks. Annotation rendering unchanged.
- `diff.ts` `diffSteps`: keys by position and reports `stepNumber` on every non-removed row; text with newlines diffs as text.
- Fork action copies `latestVersion.ingredients` and `steps` unchanged; both are already the new shape.
- Search's raw SQL reads `ing->>'name'`, which the new shape has. No change.
- `VersionDiff.svelte` step rows get the same line-break rendering as `RecipeMethod`.
- Seed script: ingredient and step literals become text, parsed with `parseIngredientText` and `parseStepText` at insert time, so the seed exercises the real parsers.

## Tests

Order: server first, then components, then e2e.

1. `ingredients.test.ts`: every row of the table; `\r\n`; blank and whitespace lines dropped; leading and trailing whitespace; `ingredientsToText` joins.
2. `steps.test.ts`: the example above; case-insensitive keyword; annotation with empty text dropped; a block whose first line starts with `tip:` is step text; multiple blank lines between blocks; a step with internal newlines; round trip through the inverse.
3. `validation.test.ts`: text reaches each parser; empty or whitespace-only text fails with the existing messages; the old JSON-shape tests are removed.
4. `diff.test.ts`: a quantity or range change shows as modified; modified rows diff the typed lines; steps number by position.
5. `ingredientDensities.test.ts`: unparsed ingredient yields `null`; a count line in the per-item table yields `quantity × grams` marked approximate; a count line not in the table yields `null`; a volume line is not marked approximate; a range converts both ends.
6. `IngredientEditor.svelte.test.ts`: value renders; an unparsable line appears in the note; fixing it clears the note; binding updates.
7. `StepEditor.svelte.test.ts`: value renders; hint present; binding updates.
8. Page component tests: edit page initialises both textareas from a version; existing error and state tests still pass with the new fields.
9. e2e `authenticated.test.ts`: the three placeholder fills and the step textarea fill become one fill per textarea.

## Left to the builder

- Note and hint wording and styling within existing form styles.
- Textarea sizing.
- Gram display format on the recipe page.
- Whether `parseIngredientText` is called once per keystroke or debounced. Lists are short; once per keystroke is fine unless it measurably is not.

## Risks

- Names now carry whatever follows the unit, including notes like `, for topping`. The ingredient diff keys on name, so a changed note reads as a replaced ingredient. Accepted.
- parse-ingredient's unit list is the library's. Pin the exact version so an upgrade is a deliberate reparse of the seed, not a surprise.
- Per-item gram weights ignore size words: `2 large eggs` and `2 eggs` both use the `egg` entry unless the table also has `large egg`. Values are marked approximate in the UI for this reason.
