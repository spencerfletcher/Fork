# Recipe page: critique report

Date: 28 October 2026. Scope: the recipe page (`src/routes/recipes/[slug]/+page.svelte`) as it ships on master, and the four mockup boards (Main, Option A, Option B, Option C) on the design canvas. Inputs: the Impeccable dual-agent critique of the live page, the Impeccable dual-agent critique of the boards, the tasteskill site review applied earlier this week, and the Impeccable detector on source and in the browser. Palette throughout is the 28 October pass: clay #b23c00, marigold #eca620 (see DESIGN.md, "Colour pass, 28 October 2026").

## 1. Overall impression

Fork's recipe page is a good generic recipe page with one authored element on it. The reading system is sound: cream paper, Bitter display, Source Sans body, a 380px ingredients aside with a 48px gap, grams inline in parentheses, clay for links. Nobody would call it templated. But take the version strip away and the page could belong to any careful recipe site. The thing that makes Fork Fork, a commit line on a cookbook page, is present but does not yet shape the page. It is a bar bolted under the title, and the version number appears three times above the fold while a visitor has no way to fork at all.

The four boards explored where that signature should live. The clearest result of the round is that the answer is not a layout. Option C, the only board authored for Fork, wins on identity by doing one thing: it makes the commit message the deck under the title and deletes the version bar. Main, the incumbent, wins on usefulness by getting name, time, serves, action, commit line, nine ingredients and five steps inside the first 900px. The recommendation below is their union: Main's body with C's header.

Two things are done well and should be protected. The commit message written as a cook's note ("Chill the dough and shift the sugar toward brown") is the best copy on the site and the only thing that teaches a stranger what Fork is without a glossary. And the ingredient row with grams in parentheses, struck on tap, is a real cooking affordance that none of the boards improved on; the boards' 200px grams column is a regression.

## 2. Health scores

### Live recipe page (preview build, logged out, 1280 / 768 / 390)

| # | Heuristic | Score | Key issue |
| --- | --- | --- | --- |
| 1 | Visibility of system status | 3 | Version and "Viewing vN" are clear; struck rows reset on reload |
| 2 | Match system and real world | 2 | "v3, 3 versions, 1 fork, Compare with v2, Initial recipe" in code font, unexplained |
| 3 | User control and freedom | 2 | No serving scaling, no clear-all, ingredients cannot stay beside the method |
| 4 | Consistency and standards | 3 | Clay means link except on step numbers; time shown twice in two formats |
| 5 | Error prevention | 3 | Whole-row tap targets strike by accident |
| 6 | Recognition over recall | 2 | Method cannot see the ingredients; the sticky column pins the photo |
| 7 | Flexibility and efficiency | 2 | Nothing for a repeat user; Fork is behind login, then a dialog |
| 8 | Aesthetic and minimalist | 3 | Version number three times above the fold; empty no-photo column |
| 9 | Error recovery | n/a | No error states on a visitor's reading page |
| 10 | Help and documentation | n/a | The grams hint is enough |
| **Total** |  | **20/32** | Fair |

First run for this target; no trend yet. Snapshot: `.impeccable/critique/2026-10-28T09-01-45Z__src-routes-recipes-slug-page-svelte.md`.

### Mockup boards (reviewed before the 28 October fixes to the boards)

| #             | Heuristic                 | Main   | A      | B      | C      |
| ------------- | ------------------------- | ------ | ------ | ------ | ------ |
| 1             | Visibility of status      | 3      | 2      | 3      | 3      |
| 2             | Match to the cook's world | 3      | 3      | 3      | 4      |
| 3             | User control              | 3      | 2      | 3      | 2      |
| 4             | Consistency               | 3      | 2      | 2      | 2      |
| 5             | Error prevention          | 3      | 3      | 2      | 2      |
| 6             | Recognition over recall   | 4      | 2      | 3      | 3      |
| 7             | Flexibility               | 3      | 3      | 2      | 3      |
| 8             | Aesthetic and minimalist  | 2      | 3      | 1      | 3      |
| 9             | Recognise what version    | 3      | 2      | 3      | 2      |
| **Total /36** |                           | **27** | **22** | **22** | **24** |

Heuristic 10 n/a on every board. C's 2s on rows 3 and 9 were the wrapped Compare link and the duplicated version chip; both are fixed on the current boards, which puts C at roughly 27 to 28, level with Main. Ranking as reviewed: Main, C, A, B.

Detector on the boards: one rule fired on all four (cream palette, which is the paper token, a false positive). No overflow, no shadows, four to five 1px borders per board, 21 to 23 text runs under 13px per board (grams, labels, mono meta). No signal between boards.

## 3. Design specificity verdict

**Live page.** Authored for Fork by one element, the version strip. Remove it and the rest is a good generic recipe page. Character is missing where it would count: no fork affordance for a visitor, "1 fork" is not a link, a single-version recipe reads "v1 · v1 · Initial recipe · 1 version", and on a phone the strip card pushes the first ingredient to about 770px.

**Boards.**

- Main: any recipe site, but the only board where every first-screen need is met. Its faults are chrome: two lifted panels, a hinge bar, a dead column under the buttons.
- Option A (full-bleed photo): the prettiest and the least useful to a cook. Ingredients begin at 960px behind 528px of photo on every return visit. It truncates the commit message, the one sentence that makes it a Fork page. Best no-photo behaviour and the shortest phone path.
- Option B (sidebar stack): a recipe app sidebar, not a cookbook page. Three boxes before food, method at 100 characters a line, and at 768 the photo lands between the two lists a cook flips between.
- Option C (commit message as deck): the only board authored for Fork. A stranger learns what Fork is from the first screen without decoding a toolbar. It deletes the version bar and loses nothing.

Verdict for the system as a whole: the typography and palette decisions are specific and hold; the composition is not yet. Fork's identity should be carried by copy and placement (the commit line, the byline, the diff rows) rather than by chrome (bars, chips, panels).

## 4. What the recipe page should look like

The target composition, assembled from the live page's working parts, Main's body and C's header. Each line traces to a finding above.

### Header (all widths)

1. Tags as a plain inline row of links, no pill chrome.
2. Title in Bitter, 52px at desktop, 36px on a phone.
3. The deck is the current version's commit message: Bitter 500, 20px, upright, full measure, on its own line. It never shares a row with anything and is never truncated. On a single-version recipe it is the recipe description, since "Initial recipe" tells nobody anything.
4. One mono byline under the deck: author · v3 · 3 versions · 1 fork · Compare with v2. "3 versions" opens the history; "1 fork" links to the forks; Compare is the diff link. The version number appears here and nowhere else. The title chip goes.
5. Prep · Cook · Serves as a second mono line, 13px minimum, with each time shown once. No stats card.
6. One action row. Visitor: Fork primary (marigold fill), Favorite ghost. Owner: Edit primary, no Fork. Logged out: Fork still rendered, linking to login with a redirect back.
7. One marigold fill per page, and it is the primary button. Version information is text, not a chip.

### Desktop, 1280 and up

- Hero row split 6/6: title block left, photo right at 4:3, capped around 440px tall, so Ingredients begin by about 540px. No full-bleed photo.
- Below the hero: the existing 380px aside with a 48px gap. The aside holds Ingredients, sticky, with grams inline in parentheses as the live page does today. The reading column holds the Method capped at 72ch with step numerals in clay JetBrains Mono.
- No photo: the hero collapses to a single 760px title block, left aligned, and the page simply starts sooner. No tint panel, no empty column.

### iPad, 768 to 1023

- Title block, then the photo as a 16:9 band capped around 300px, then Ingredients, then Method, single column at 72ch. The two-column premise does not survive at 768 on any board, so it should not be attempted.
- Open: whether a one-line sticky "Ingredients" summary or jump link is worth it here; decide after the phone answer.

### Phone, up to 699

- Title block, photo as a 21:9 crop around 150px, mono lines on one row each, actions full width, Ingredients by about 600px.
- Every link in the byline and meta rows gets a 44px hit area; mono text is 0.8125rem on touch widths.
- Open: how a cook flips between Ingredients and Method once the aside is gone. The candidates are a sticky two-tab bar below the header or a long-press shortcut; neither has been drawn.

## 5. Consolidated priority issues

Status reflects the current boards and master as of this report. Commands are the Impeccable step that owns the fix.

| Pri | Issue | Where | Status | Owner |
| --- | --- | --- | --- | --- |
| P0 | Commit line truncated or wrapped | A truncates; C wrapped | C fixed; A still truncates, and A is not recommended | shape |
| P1 | Recipe starts a screen late on phone (first ingredient ~770px at 390) and iPad (Ingredients ~875px at 768) | live page | open | adapt |
| P1 | Visitor cannot fork and cannot see forking exists; "1 fork" not a link | live page | open | shape |
| P1 | Touch targets 16 to 20px tall at 12px mono in strip and meta row | live page | open | adapt |
| P1 | Three marigold fills: title chip, strip or deck chip, Fork button | Main, A, B; C has one | partly fixed | shape |
| P1 | Ingredients below the fold at 1280 (A at 960px, B at 680px) | A, B | open, boards not recommended | shape |
| P2 | Method cannot see the ingredients; 103-character lines | live page | open | layout |
| P2 | Version number three times above the fold; servings and time duplicated | live page, Main | open | distill |
| P2 | Owner state wrong: logged-in owner shown "Fork this recipe" | all boards | open | shape |
| P2 | No-photo unresolved: 480 to 690px hole | Main, C | open | layout |
| P3 | Tablet is the phone stretched | live page | open | adapt |
| P3 | No-photo desktop leaves ~700px of empty column | live page | open | layout |
| P3 | Grams 200px from the ingredient in a 380px column | all boards | open; live page is already right | shape |
| P3 | Step numerals inconsistent across boards | C | fixed, clay mono everywhere | — |

## 6. Mechanical findings

Deterministic scans, all advisory.

- Eleven font sizes off the DESIGN.md ramp in the targeted files: RecipeCard 0.8125 and 0.9375rem, Navbar 1.375, 0.875 and 0.95rem, VersionStrip and VersionDiff 0.875rem; two 3px chip radii in VersionStrip. Source-wide, 60 advisory findings, 56 of them font sizes, 22 in `app.css`. The ramp in DESIGN.md is missing four sizes the code uses; the honest fix is to add them to the ramp, not to retune the code.
- Three 10px Prep/Cook/Serves labels under the 11px floor (Details.svelte).
- Two method steps at about 103 characters a line in the 724px column (RecipeMethod.svelte).
- h1 followed by h4 with no h2 (RecipeIngredients.svelte, RecipeMethod.svelte).
- Cream background flagged on every page; false positive, it is the paper token.
- On the boards, 21 to 23 text runs under 13px each: grams, labels and mono meta. The target composition sets mono at 13px minimum on touch widths.

## 7. Persona flags that change the design

- Alex (keyboard, logged out): no Fork; logged in, Fork is about 900px down and then a dialog; Compare links sit 1000px from their rows; "1 fork" is not a link; no keyboard path through the strip.
- Jordan (first visit): five unexplained marks before the recipe; nothing teaches what a fork is; the commit message reads as a tagline, which is the one place the confusion is productive; "Initial recipe · 1 version" says nothing; no cue that rows are tappable. On the boards, "Fork this recipe" is the first verb before an ingredient is read, and Favorite, the action a first-timer recognises, is the ghost.
- Casey (cook, phone on the counter): first ingredient a scroll away; 16px body and 12px mono not readable at arm's length; links under the thumb; a brush strikes a row; a reload resets the checks; quantities a scroll from the step. No board shows how to flip between Ingredients and Method on a phone.

## 8. Shipped this week

Applied and committed on master, unpushed:

- Palette pass: clay #b23c00, marigold #eca620, hover #dc980a, locked by `src/app.css.test.ts` and the e2e colour assertions.
- Diff type at 14px on every screen; commit bar sizes aligned to the ramp; diff content at 72ch.
- Search box fills the page below 1024px; viewport heights use dvh; tag tabs run to the phone's edge.
- PRODUCT.md, DESIGN.md and the `.impeccable/design.json` sidecar.

Not yet decided: whether to track `.impeccable/critique/`, `.codex/hooks.json`, `.github/hooks/impeccable.json`, `.taste-skill/`, the skill folders and `skills-lock.json`.

## 9. Remaining questions

Decided 28 October 2026, after path boards on the design canvas (rows Q1 to Q3):

- Q1: the signature is a sentence. The commit message is the deck; the version bar is deleted; one mono byline carries the version, counts and Compare link. Revised the same evening after seeing it built: the description is the deck (sans, 20px) and the commit message returns to a version bar under it, with the marigold chip, clamped to two lines. The title chip stays gone.
- Q2: the owner's primary action is Edit, with no Fork, as master already does. Fork is primary for every other signed-in reader. Revised after the build the same day: logged out, no action row at all; a lone Fork button read as odd and the login round trip was not worth it.
- Q3: the photo is the right half of a 6/6 hero, 4:3, capped at 440px. Ingredients start by about 600px at 1280.
- Q4: step numerals are clay JetBrains Mono everywhere; the live page changes from Bitter to match.
- Q5: grams stay inline in parentheses as the live page does; the boards' right column is dropped.
- Q6: the phone gets a sticky two-tab bar (Ingredients | Method) drawn at 390 before the build decides.
- Q7: `.impeccable/critique/` snapshots are tracked in git.
- Q8: Impeccable hooks, the design-taste-frontend skill and today's report are committed; `.taste-skill/` is ignored.
- Q9: the One Fill Rule is deleted from DESIGN.md. Marigold is the action colour; where it appears is judged page by page.
- Q10: the phone fold is accepted at about 835px; the sticky tab bar, inside the first screen, is the remedy.
- Q11: viewing an older version swaps the deck to that version's commit message and the byline reads "v2 of 3 · Viewing history · Back to v3". No banner.
- Q12: forking is one click. The copy's first version carries a default message naming the source and version; the dialog goes.

Defaults taken without a question, each reversible: the byline drops the date (history has it); tags stay after the description; Favorite stays for the owner; serving scaling is not in this round; the four font sizes the code uses are added to the DESIGN.md ramp rather than retuned; the h1 to h4 heading skip is fixed in the build; struck ingredient rows persisting across a reload is a later optimisation.

Each remaining question with a recommendation. "No" is a fine answer to any of them.

1. **Is the signature a bar or a sentence?** Recommendation: a sentence. The commit message becomes the deck and the version bar is deleted. This is the single change that moves the specificity verdict.
2. **What is the primary action on your own recipe?** Recommendation: Edit, with Fork hidden for the owner. Fork stays primary for everyone else, rendered logged out too.
3. **Does the photo earn 40 percent of the first screen?** Recommendation: no. Cap it at a 6/6 hero on desktop and a short band on tablet and phone. Ingredients are the hero of a page read at arm's length.
4. **Step numerals: clay mono as chosen for the boards, or Bitter clay as the live page?** Recommendation: clay mono, as decided; it is one of two mono accents a cook meets on the page and the reviewer's objection (clay reads as a link) is the same either way. Unify the live page to match.
5. **Grams: inline parentheses as live, or a right column as drawn?** Recommendation: inline. The boards regressed this.
6. **Phone flip between Ingredients and Method.** Recommendation: draw a sticky two-tab bar below the header and test it at 390 before deciding; it is the only open composition problem the boards did not address.
7. **Track the critique snapshots?** Recommendation: yes, `.impeccable/critique/` is small, and the trend line only works if the history is in the repo.

## 10. Next steps

1. Answer questions 1 to 3 above; they fix the header.
2. `/impeccable shape` the recipe page with the composition in section 4 as the brief, producing one board at 1280, 768 and 390, with both visitor and owner states and the no-photo variant.
3. Build it, then `/impeccable adapt` for the phone and iPad findings and `/impeccable polish` before shipping.
4. Re-run `/impeccable critique` on the page; the target is 26/32 or better, which the header change plus the phone reading-start fix should reach.

## 11. Built, 28 October 2026

The composition in section 4 shipped on master the same day, in nine commits from the fork server change to the page layout. Measured on the build at 1280: Ingredients at 575px with a photo and 499px without; on a phone, 817px with the tab bar at 749px. The whole e2e suite (82 tests) and unit suite (522) pass. Not done: a forks page for the "1 fork" count to link to, so the count is text; struck rows still reset on reload. `VersionStrip.svelte` and its test are no longer used by any page and are left for Spencer to delete.

## 12. Second and third critiques, 28 and 29 October

Re-scored after the build: 20/32, then 21/32 after a polish pass that unboxed the version bar, moved tags out of the hero's reading order and unified the label style. The third run's two P1s, the clamp's "more" (orphaned, undersized, stale after navigation) and a header with no rhythm, were closed the same night: the clamp is gone and the note runs at full length; the header is three blocks at 24px (title and description; chip, note and byline; one meta line of Prep/Cook/Serves with the tags after them in sans). Every ingredient row now bolds its leading quantity and typed fractions render as glyphs. Snapshots in `.impeccable/critique/`.

## 13. The header rethink, 29 October 2026

After seven critique rounds the header still carried eleven text treatments across three faces. Spencer called it worse, and asked for research instead of another pass. Eight reference headers were measured (GitHub, GitLab, Hugging Face, npm, Serious Eats, Bon Appétit, King Arthur, NYT Cooking). The calm ones share four rules: one family below the title; all metadata in one size and one colour, weight the only emphasis; the description as plain body text; colour spent once. Fork broke all four. Three boards applied the rules (repository, cookbook, one voice); Spencer composed a mix: title, byline with the counts, description, the mono note with the chip and a margin rule, a rule, Prep · Cook · Serves on one row, tags as a quiet line, pills. A scoped critique of that board scored 21/28 and asked for 44px pills, a wrapping measure, a phone title size and an accessible label on the chip, all built. Links stay clay because the whole site's anchors are clay; tags take Ink 2 with clay on hover.

## 14. Parked ideas

- **Outlined Fork and Star controls** (29 October 2026, Spencer's note, both of us leaning against): two outlined buttons on one row, the fork count inside the Fork button behind a hairline, Favorite reduced to a star icon that fills marigold when set, the GitHub repo pair. It would take marigold out of the hero and move the count to where it acts. Against: Fork is the product's verb on a Read page, so one filled action is earned; the count half would be a dead button until a forks page exists; an icon-only star drops the word a first-timer needs on a phone. Revisit if the filled pill ever reads as too much, or when a forks page lands.
- **Fork and Favorite from an older version** (29 October 2026, Spencer): today both pills are hidden while viewing history (`canFork` and `canFavorite` require the latest version). Fork from an older version copies that version's content; the fork action already names the source version in its first commit message, so the editor and the diff page need nothing new. Favorite becomes version-level (Spencer, same day: the dish you liked is a specific version, and the author's next edit should not change what you saved). That means: favorites keyed by version id, a migration and a reseed; the favorites page shows the saved version with a quiet "v4 now" link when the recipe has moved on; the star on the recipe page reflects this version, and whether favoriting a newer one adds or moves is still open; fork count stays recipe-level. Todo, not yet built.
