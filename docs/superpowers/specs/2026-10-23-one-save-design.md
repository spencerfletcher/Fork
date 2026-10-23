# One save, versioned formulation — design

Date: 2026-10-23. Status: approved by Spencer in conversation, pending plan.

## Intent

Editing a recipe is one act. Today the edit page has two forms with two Save buttons: "Save info" overwrites the `recipes` row, "Save new version" appends a `recipe_versions` row. Each submit redirects away, so edits in the other form are lost. And servings, times, title and description live on `recipes`, so version 1 "for four" and version 2 "for eight" share one servings number and one title. After this change:

> I changed the ingredients, servings and method. One save records those changes together, and the previous version still describes what I cooked before.

## Goals

- One form, one "Save changes" button, one action, one transaction.
- Each version carries its own complete formulation: title, description, servings, prep and cook minutes, ingredients, steps.
- Unchanged or settings-only submissions do not create a version.
- A failed save keeps what the user typed.
- Two tabs cannot silently overwrite each other or produce duplicate version numbers.

## Non-goals

- Autosave, drafts that survive a reload, collaboration, merging.
- Stable ingredient identities, a yield model, scaling (next feature).
- Forking a historical version. Forks stay latest-only.
- Backward compatibility with stored rows. Pre-production: change the schema, reseed.

## Anti-goals

- Deciding "did it change" from the visual diff component. Change detection is its own pure comparison.
- Any path that writes `recipes.title` or `recipes.description` without a version carrying the same values.
- Changing a recipe's slug when its title changes. URLs stay stable.

## Ownership rule

**The latest version owns the current formulation.** `recipes.title`, `recipes.description`, `recipes.servings`, `recipes.prepTimeMinutes` and `recipes.cookTimeMinutes` are maintained copies of the latest version's values, kept only because the full-text search vector is a generated column on `recipes` and list pages and cards read `recipes` without a join. They are written in the same transaction as the version that defines them, on create, on save and on fork, and never edited on their own. A comment on the columns states this; server tests enforce it (after every write path, each copy equals the latest version's value).

Recipe-level, not versioned: slug, image URL, visibility, tags, author, fork lineage, timestamps. A historical version page therefore shows historical formulation with the current image, tags and access rules. That boundary is deliberate.

## Storage

`recipe_versions` gains:

| column              | type          |
| ------------------- | ------------- |
| `title`             | text not null |
| `description`       | text null     |
| `servings`          | integer null  |
| `prep_time_minutes` | integer null  |
| `cook_time_minutes` | integer null  |

`recipes` keeps `title`, `description`, `servings`, `prep_time_minutes` and `cook_time_minutes` as maintained copies, with the ownership comment. No column is dropped.

Add `UNIQUE (recipe_id, version_number)` on `recipe_versions` as the last line of defence against duplicate numbers. There is none today.

One hand-written migration in `supabase/migrations/` (`supabase migration new one_save_versioned_formulation`), `schema.ts` edited in the same commit, seed updated, local and hosted reseeded. No backfill.

## Types

In `src/lib/recipes/types.ts`:

```ts
export type Formulation = {
	title: string;
	description: string | null;
	servings: number | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	ingredients: Ingredient[];
	steps: Step[];
};
```

A version row is a `Formulation` plus `id`, `recipeId`, `versionNumber`, `commitMessage`, `createdAt`, `createdBy`. Fixtures: `makeFormulation(overrides?)` in `fixtures.ts`, built from `makeIngredient` and `makeStep`.

## "Differs" — one comparison

New module `src/lib/recipes/formulation.ts`:

- `formulationChanged(from: Formulation, to: Formulation): boolean`
- `changedGroups(from, to): ('title' | 'description' | 'servings' | 'times' | 'ingredients' | 'steps')[]`

Normalisation, applied to both sides: title trimmed; description trimmed, empty becomes null; numbers compared as values; ingredients compared by `text` in order; steps compared by `text` and annotation (`type` and `text`) in order. Parsed quantities, units and gram weights do not take part, so a wording change counts even when the parser reads the same quantity, and a parser or table change never creates a version by itself.

Tags are compared as a set of names, so a reordered checkbox list is not a change. Settings comparison (image URL, visibility, tag set) lives in the action, not in this module.

Generated commit message when the user leaves it blank and a version is written: `Updated ` plus the changed groups joined with ", " in the fixed order above, for example `Updated ingredients, servings`. Deterministic, no AI.

## Validation

`validation.ts` regroups the existing zod pieces:

- `parseFormulation(formData): Result<Formulation>` — title (required), description, servings, prep and cook minutes (existing `optionalInt`), ingredients and steps text (existing content schema with its caps).
- `parseSettings(formData): Result<{ isPublic: boolean; tagNames: string[] }>`. The photo is a file, not a field: it is read from the multipart body in the action and uploaded as the new page does today.

`parseRecipeMeta` and `parseRecipeContent` go away; their tests move with their fields.

## Edit page

### Load

Returns `recipe` (settings and ownership), `latestVersion` (the formulation), `allTags`, and `revision`: a string token identifying the recipe's state, `${latestVersion.id}:${recipe.updatedAt.getTime()}`. A settings-only save bumps `updatedAt`, a version save changes the id, so any committed change changes the token.

### Form

One `<form method="POST" action="?/save" enctype="multipart/form-data" use:enhance>`. Keep the two headings as visual grouping ("Recipe" for the formulation, "Settings" for photo, tags, visibility) with a single "Save changes" button at the bottom and the optional "What changed?" field next to it. Hidden input `revision`.

### Photo

The edit page gains the same photo upload as the new page: a file input with preview, replacing the image URL text box. The current photo shows as the preview when there is one, with a "Remove photo" control that sets a hidden `removeImage` flag. Upload goes to the `recipe-images` bucket exactly as in the new action; extract that upload into one shared server helper (`src/lib/server/images.ts`, say) used by both actions. A new file replaces the stored URL; `removeImage` clears it; neither means no change. An upload failure returns 400 with the draft and writes nothing.

The whole form is wrapped in `<fieldset disabled={submitting}>` while a request is in flight, so nothing typed during the request can be lost by the redirect.

### Dirty state

Derived, not set on first input. The page holds the editable draft as `$state` (every field) and the loaded baseline. `dirty = serialise(draft) !== serialise(baseline)`, where `serialise` trims strings, sorts tag names and reads the two editors' text. Editing a field and restoring it clears the hint. The existing "Unsaved changes" hint stays, once.

### Failure

The action returns `fail(status, { error, draft })` where `draft` is every submitted text field as raw strings (title, description, servings, prepTimeMinutes, cookTimeMinutes, ingredients, steps, isPublic, tags, commitMessage, revision). A chosen file cannot be returned; after a failure the user picks it again, and the page says so next to the photo field when a file had been chosen. The page initialises its draft state from `form?.draft ?? baseline`, so an invalid value stays visible for correction. The baseline is untouched, so "Unsaved changes" still shows.

Status 400 for validation, 409 for a stale revision with the message "This recipe was changed in another tab. Reload to see the latest version, then reapply your edits." Nothing is merged or overwritten on 409.

### Action, in order

1. Auth and ownership as today.
2. `parseFormulation`, `parseSettings`; on failure return 400 with the draft.
3. Transaction:
   1. `SELECT … FROM recipes WHERE id = … FOR UPDATE` (Drizzle `.for('update')`), so concurrent saves on one recipe run one at a time.
   2. Load the latest version inside the transaction. Compute the current revision token; if it differs from the submitted one, return 409 with the draft.
   3. `changed = formulationChanged(latest, submitted)`; `settingsChanged` = a new file was uploaded, `removeImage` is set with a photo present, visibility differs, or the tag set differs.
   4. If neither: no writes, redirect.
   5. If `settingsChanged`: update `recipes` image URL, visibility, `updatedAt`; replace tag rows (existing tag handling, including creating new tags). The file upload itself happens before the transaction, after validation, so a failed upload never leaves a half-written save; an orphaned file in the bucket is acceptable.
   6. If `changed`: insert the version with `versionNumber = latest.versionNumber + 1`, the submitted formulation, the user's commit message or the generated one, `createdBy`; update the five copies on `recipes` and `updatedAt` from the same values.
4. Redirect to the recipe page.

A commit message with no formulation change is ignored, no version, no write.

## New page

Already one form and one action with photo upload. It inserts the recipe (settings and the five copies) and version 1 (the full formulation, commit message "Initial recipe") in one transaction. `parseFormulation` and `parseSettings` replace the current two parsers; the upload moves to the shared helper. Its page gets the same draft-preserving `fail` shape and derived dirty state.

## Fork

The fork action copies the source's latest version as one snapshot: title, description, servings, times, ingredients, steps become the fork's version 1 with fresh ids, timestamps, `createdBy` the forker, commit message as today. The new `recipes` row takes its five copies from that same snapshot, image and visibility from the source recipe, tags copied, `parentId` set. Slug from the snapshot title plus the existing random suffix. No spreading of database rows.

## Readers

- Recipe page loader: `currentVersion` (requested or latest) supplies title, description, servings, times, ingredients, steps to the hero, details, SEO title and description, and the history banner. `recipe` supplies image, tags, author, visibility, fork lineage. The hero and details components take the version fields instead of recipe fields.
- Cards, list pages and search keep reading the copies on `recipes`, including total time on cards. No list query changes.
- Diff: `diff.ts` gains `diffMeta(from: Formulation, to: Formulation): MetaDiffRow[]` with `MetaDiffRow = { field: 'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes'; from: string | number | null; to: string | number | null }`, only changed fields. `VersionDiff.svelte` takes `metaDiff` as a required prop and renders the rows as a short list above the ingredient columns, with a label per field ("Title", "Description", "Servings", "Prep time", "Cook time"). The compare page and the landing page pass it.
- Seed: the cookie recipe's second version changes servings (24 to 36 cookies, say) and the title ("Classic" to "Thick and Chewy"), so the landing diff and the compare page show metadata rows out of the box. The landing page's "best diff" ranking counts meta rows as changes.
- History list and any other reader of `recipe.servings` or `recipe.prepTimeMinutes` switch to the version. `svelte-check` is the net: the task is not done until it is green.

## Tests

Order: server logic, then components, then e2e. Fixtures through `fixtures.ts`.

1. `formulation.test.ts`: unchanged is not changed; each field alone is a change; ingredient wording change with identical parse is a change; step annotation change is a change; whitespace-only title and description differences are not; `changedGroups` order and the generated message.
2. `validation.test.ts`: regrouped fields; draft strings round-trip.
3. `diff.test.ts`: `diffMeta` returns only changed fields, null handling.
4. `edit/page.server.test.ts`: the outcomes table below; ownership rule after each write (all five copies); stale revision returns 409 with the draft and writes nothing; a thrown error inside the transaction leaves no recipe, version or tag change; commit message without a formulation change writes nothing; a new photo or `removeImage` counts as a settings change; a failed upload returns 400 and writes nothing.
5. `new/page.server.test.ts`, `[slug]/page.server.test.ts` (fork): copies land on both rows; fork is a complete snapshot; source untouched.
6. Component tests: `VersionDiff` renders meta rows; hero and details read version fields; edit page shows the draft after a failed save, derives dirty from the draft and clears it when restored, disables the form while submitting.
7. e2e in `authenticated.test.ts`: the acceptance scenarios.

| Submitted changes              | Result                                                |
| ------------------------------ | ----------------------------------------------------- |
| Formulation changed            | One new version; copies and settings updated together |
| Only image, visibility or tags | Settings updated; no version                          |
| Nothing                        | No writes, not even `updatedAt`; redirect             |
| Only commit message            | No writes                                             |
| Stale revision                 | 409, draft returned, no writes                        |
| Invalid field                  | 400, draft returned, no writes                        |

## Acceptance

- Create at four servings. Edit to eight with different quantities and a longer cook time, save once. Version 1 and version 2 each show their own servings, times and ingredients. Compare explains all of it, metadata rows included.
- Rename and revise the description. The old version keeps its title and description; cards and search show the new ones; the slug is unchanged.
- Change content and visibility and tags together: everything saves, exactly one new version.
- Settings-only and unchanged submissions: no version; the unchanged one performs no writes.
- Invalid field: draft still in the form, nothing committed.
- Two tabs on version 2: the second save gets 409 and keeps its draft; version numbers stay unique.
- Fork after changing servings and title: the fork's version 1 has the complete latest formulation; the source is untouched.

## Left to the builder

- Exact layout of the single form and the placement of the "What changed?" field.
- Wording of the generated commit message beyond the pattern given.
- Shape of the `draft` object as long as it carries raw strings for every field.
- Whether the stale check compares the token string or its two parts.
- Name and location of the shared upload helper; preview markup on the edit page can copy the new page's.

## Decisions made in review

- Card times: Spencer chose to keep times as maintained copies on `recipes` (option 3 of drop / join / copy), so cards and list queries are untouched.
- Photos: Spencer chose upload on both pages; the edit page's image URL box goes away.
