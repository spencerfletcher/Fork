---
target: Live site baseline before redesign
total_score: 19
max_score: 32
na_heuristics: 5,7
p0_count: 0
p1_count: 4
target_identity: "url:https://recipes.spencerfletcher.com/"
timestamp: 2026-10-31T09-39-05Z
slug: recipes-spencerfletcher-com
---
# Fork live-site baseline — 31 October 2026

Target: https://recipes.spencerfletcher.com/

Two independent assessments used parent-captured live browser screenshots and DOM. Child browser connections failed; the main chat successfully inspected Edge. This is a baseline, not a comparison against the unshipped redesign.

## Verdict

The site has a coherent cookbook identity: warm paper, serif titles, food photography and restrained monospace version details. Preserve the readable recipes and explicit version diffs. Improve mobile cooking access, navigation clarity and functional gaps before adding visual complexity.

## Priority issues

1. **P1: Baking tag is broken.** Visible Baking links point to `/tags/Baking`, which returns “Tag not found.” `/tags/baking` also fails. Dessert, Dinner, Indian, Spicy and American resolve. Do not assume this is only URL case without inspecting the data/lookup.
2. **P1: Action-label contrast.** Save/Edit recipe text is rgb(232,168,58) over rgb(250,244,232), 1.90:1 at ordinary text size. Use dark text or a darker action color.
3. **P1: Password recovery unavailable on live.** Login has no recovery link; `/forgot-password` and `/reset-password` return 404. Those routes existing in the local checkout does not establish live behavior.
4. **P1: Mobile cooking/action access.** Save/Edit appear after all ingredients, method and details. Tablet imagery takes most of the first screen. Provide nearby actions and quicker access between ingredients and method; constrain the tablet image.
5. **P2: History discoverability.** Long one-line history rail clips notes and Compare beyond the phone viewport without a visible scroll cue. Use a clear History/Compare entry or disclosure.
6. **P2: Durations omit waits.** Cookies show 28 minutes but require at least 2 hours chilling; brown-butter cookies show 31 minutes but require 30 minutes chilling; tikka shows 1 hour but requires at least 1 hour marination before cooking. Label active time or include waiting time.

## Page-by-page observations

| Surface | Baseline assessment |
|---|---|
| Logged-out landing | DOM inspected before login: concise product promise and real version comparison, then recipes. Visual capture was not retained before sign-in. |
| Signed-in home | Clear photographic grid; title “Recipes” conflicts with navigation “Recipes” leading to My Recipes. |
| My Recipes | Consistent cards. Label navigation “My recipes” to distinguish personal from public browsing. |
| Search | Query and combined tag filter work; empty state suggests adjusting search/filters. No result-count feedback. |
| All three recipe details | Strong readable ingredient rows and numbered method. Descriptions shown on cards/editor are absent from detail. Mobile actions/history and tablet image need attention. |
| Historical recipe | Clear “Viewing v1” notice, old content and return to current version; actions absent. Preserve. |
| Comparison | Clear visual substitutions and mobile reflow. Accessible snapshot combines old/new values without clear before/after wording. Heading hierarchy skips levels. |
| Forked recipe | Attribution link works. Fork browsing route `/recipes/classic-chocolate-chip-cookies-f1bd18d8/forks` is 404; no actual clickable link to that route observed, so this is unavailable functionality, not a proven broken link. |
| All visible tags | Five categories work; Baking fails in both tested cases. |
| Profile | Simple and consistent; mobile menu omits desktop profile link and instead shows account email. Profile can still be reached through recipe bylines. |
| Favorites | Empty state offers Explore recipes, but an empty search/filter panel dominates it. Hide filters until useful. |
| New Recipe | Simple labeled form, useful step syntax and public-visibility explanation. Phone Cook time label wraps and misaligns numeric fields. Long blank textareas and native file control make it feel less finished. |
| Edit Recipe | Fields populated correctly; optional change note and visibility scope are useful. No unsaved preview/diff inspected. No save submitted. |
| Login/signup | Simple two-field forms, but generic page titles; missing recovery flow. |
| Errors | Recognizable 404 and Home escape, but copy conflates missing content with system errors. |

## Preserve and verify after redesign

- Real word-level diffs, fork attribution, older-version notice and return-to-current link.
- Accessible ingredient/step labels and reversible checked state. Visible ingredient-row tap was verified and restored; initial direct checkbox automation failed but visible row worked.
- Search + tag filtering and empty-result recovery.
- Owner-specific Edit action, read-only historical view, populated editing form.
- Public visibility explanation and optional change note.
- No document-wide overflow at 390px on home/search/recipe/diff/new; recipe also captured at 820px.

## Heuristics (screenshot-scoped)

Status 3/4; real-world match 2/4; control/freedom 2/4; consistency 3/4; error prevention not assessed; recognition 2/4; efficiency not assessed; minimalism 3/4; recovery 2/4; help 2/4. Total 19/32. This is not a release-quality score.

## Personas and experience

Browsing is inviting and low effort. A distracted cook faces buried mobile actions and understated elapsed time. A first-time nondeveloper must infer fork/version/commit terminology. Low-vision users face faint metadata and measured low-contrast controls. The editor's syntax and visibility guidance provide useful reassurance.

## Evidence and limits

Screenshots: `.impeccable/critique/evidence/2026-10-31-live-baseline/`.

Independent technical reviewer ran the Impeccable detector against saved live rendered HTML: one skipped-heading warning (h1 to h4). Deployed CSS was unavailable to the offline scan; contrast came from live computed styles. No browser overlay injected because evaluation is read-only.

No recipe saves, forks, uploads, favorites changes, credential changes or logout performed. No actual screen-reader, performance/network, full keyboard, successful form submission, or no-photo recipe tests. No redesign inspected; no regressions established. Temporary evidence retained per repository no-deletion rule.

Questions skipped: user requested a baseline review before a separately planned redesign; no implementation scope decision is needed for this deliverable.
