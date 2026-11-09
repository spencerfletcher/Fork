# UI reuse sweep · 9 Nov 2026

Read-only audit of `src/` after the five MVP slices landed, asked for by Spencer ("reuse components where the shape is the same; don't force a component onto a different item"). Line numbers are as of master `9c21877`. The refactor slice works from this list; items are ordered safest first.

## Shared components to extract (same shape in two or more places)

| Pattern | Copies | Extract |
|---|---|---|
| Inline two-step confirm | `routes/recipes/[slug]/edit/DeleteRecipe.svelte`, `routes/journal/[id]/edit/DeleteEntry.svelte` (near line-for-line; DeleteEntry adds a 44px rule DeleteRecipe lacks). Profile unfriend/block confirms (pass 1) are the third. MoreMenu's block step stays as is. | `src/lib/components/ui/ConfirmStep.svelte` `{trigger, label, explanation, confirmLabel, keepLabel, action, enhance, pending, error}` |
| Form actions row | `RecipeForm.svelte` (Save primary, Cancel `btn-ghost`), `routes/journal/EntryForm.svelte` (Cancel as a local text link, Delete entry). Spencer: Cancel gets the same padding as Save; Delete pinned right with a gap, own line on phone. | `src/lib/components/ui/FormActions.svelte` `{submitLabel, pending, cancelHref, danger?: Snippet}` |
| Radio choice rows (icon + label + sentence) | `RecipeForm.svelte` audience fieldset, `EntryForm.svelte` audience fieldset (identical CSS but a 2-column grid). Spencer: radio centred on the first line, gap about 60% of today's. | `src/lib/components/ui/ChoiceGroup.svelte` `{name, legend, options:{value,label,note,icon}[], value (bindable), columns?, describedBy?, hint?}` |
| Initial avatar | Navbar (32), RecipeCard (28), Discover lead (28), FeedEntry (36), friends page (36/32), profile (72/56). | `src/lib/components/ui/Avatar.svelte` `{username, size, tone?, responsive?}` |
| @handle | `Username.svelte` exists; hand-rolled in RecipeCard (`.card-handle`, `.meta-author`), Discover spans, Navbar. | `Username` takes `class`; app.css `.handle` for in-link spans |
| Empty states | `.empty-state` exists (users, search, tags, forks); hand-rolled in Discover, Cookbook (two), Journal, Friends (Journal and Friends identical). Wording drift "No recipes match" vs "found". | Discover uses `.empty-state`; `src/lib/components/ui/EmptyPanel.svelte` `{title, children, action?, centered?}` for Cookbook, Journal, Friends |
| Result status line | Cookbook (visible, "match"), Discover and Search (`sr-only`, "found"), Journal (visible). | one wording; `src/lib/components/ui/ResultStatus.svelte` `{count, filtered, visible?}` |
| Entry source line | `JournalEntry.svelte` and `FeedEntry.svelte` both build the recipe link, version chip, "from host" and "Recipe deleted". | `sourceHref()` in `lib/journal.ts` or `EntrySource.svelte` |
| Optimistic toggle | RecipeActions save, FeedEntry like and save. | `src/lib/optimisticToggle.svelte.ts` (flip, roll back, error, in-flight guard). Medium risk; last. |
| Icons | Two `Icons.svelte` files plus inline SVGs; lock drawn 3 times, Friends drawn 4 different ways, chevron 2, magnifier 2 (r7 vs r8); FeedEntry imports across routes; audience labels defined 3 times. | one `src/lib/components/Icons.svelte` with `audienceIcon()`, lock, like, more, fork, versions, save, chevron, search; one Friends drawing; audience labels from one const |

## CSS that belongs in app.css

- `.text-btn`: no base rule; defined locally in PhotoField, friends page, FeedEntry (and the `.login` link, JournalEntry's fork button). Base: clay, 600, 24px hit, 44px under 700px or coarse pointer; `.text-btn--ink` variant. Hover (pass 1) then applies everywhere.
- `.page-inner--narrow { max-width: 680px }` replacing three local 680px copies (journal new/edit, EntryForm); Journal list's 880px goes with Spencer's one-width decision; Navbar `max-w-[1200px]` → `max-w-(--max-width)`.
- `.page-head` / `.page-sub` for the h1 + subline on Cookbook, Journal, Friends, Discover.
- Dot separator utility (`.dot-list > * + *::before`), replacing 6 CSS copies and 3 typed `·`.
- `.hit-link` utility for the inline-link hit trick (6 copies, two drifted values).
- Local `.btn-primary { min-height: 44px }` overrides in 4 files: measure, then delete if redundant.
- EntryForm's select restyle duplicates the base `select` rules: delete.
- `.lock-note` box: EntryForm and JournalEntry, nearly identical.

## Helpers

- `dayLabel` accepts `string | Date` (two callers convert by hand).
- `compactCount` moves to `lib/helpers.ts`; FeedEntry's like count uses it.
- `plural(n, word, pluralForm?)` gains an irregular form; five hand-rolled plurals use it.

## Leave alone (different shapes)

Disclosure menus: `Dropdown.svelte` (pass 1) serves MoreMenu and the avatar menu; GroupedTextEditor's Insert ▾ and VersionBar's picker have their own semantics. Segmented filter (Cookbook), section tabs (recipe page), tag tabs: one use each; at most share the forced-colours underline rule. Recipe page's own `.page-inner` re-roll is justified by the full-bleed band.
